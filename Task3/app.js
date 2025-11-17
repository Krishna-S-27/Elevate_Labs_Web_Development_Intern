const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs").promises;
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "books.json");


async function loadBooks() {
  try {
    const data = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
   
    const seed = [
      {
        id: "1",
        title: "1984",
        author: "George Orwell",
        year: 1949,
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        title: "Sapiens",
        author: "Yuval Noah Harari",
        year: 2011,
        createdAt: new Date().toISOString(),
      },
    ];
    await saveBooks(seed);
    return seed;
  }
}

async function saveBooks(books) {
  await fs.writeFile(DATA_FILE, JSON.stringify(books, null, 2), "utf8");
}


app.use(express.static(__dirname));


app.get("/books", async (req, res) => {
  try {
    const q = (req.query.q || "").toLowerCase();
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "20", 10), 1);

    const books = await loadBooks();
    let filtered = books;

    if (q) {
      filtered = books.filter(
        (b) =>
          String(b.title).toLowerCase().includes(q) ||
          String(b.author).toLowerCase().includes(q) ||
          String(b.year || "").includes(q)
      );
    }

    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    res.json({
      total: filtered.length,
      page,
      limit,
      data: paged,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load books" });
  }
});

app.get("/books/:id", async (req, res) => {
  try {
    const books = await loadBooks();
    const book = books.find((b) => b.id === req.params.id);
    if (!book) return res.status(404).json({ error: "Book not found" });
    res.json(book);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});


app.post("/books", async (req, res) => {
  try {
    const { title, author, year } = req.body;
    if (!title || !author)
      return res.status(400).json({ error: "title and author are required" });

    const books = await loadBooks();
    const newBook = {
      id: uuidv4(),
      title: String(title).trim(),
      author: String(author).trim(),
      year: year ? Number(year) : null,
      createdAt: new Date().toISOString(),
    };
    books.unshift(newBook);
    await saveBooks(books);
    res.status(201).json(newBook);
  } catch {
    res.status(500).json({ error: "Failed to create book" });
  }
});

app.put("/books/:id", async (req, res) => {
  try {
    const { title, author, year } = req.body;
    const books = await loadBooks();
    const idx = books.findIndex((b) => b.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Book not found" });

    if (!title && !author && typeof year === "undefined") {
      return res
        .status(400)
        .json({ error: "Provide at least one field to update" });
    }

    const updated = { ...books[idx] };
    if (title) updated.title = String(title).trim();
    if (author) updated.author = String(author).trim();
    if (typeof year !== "undefined") updated.year = year ? Number(year) : null;
    updated.updatedAt = new Date().toISOString();

    books[idx] = updated;
    await saveBooks(books);
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to update book" });
  }
});

app.delete("/books/:id", async (req, res) => {
  try {
    const books = await loadBooks();
    const idx = books.findIndex((b) => b.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Book not found" });
    const removed = books.splice(idx, 1)[0];
    await saveBooks(books);
    res.json({ message: "Deleted", book: removed });
  } catch {
    res.status(500).json({ error: "Failed to delete book" });
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Books API + frontend running on http://localhost:${PORT}`);
});

