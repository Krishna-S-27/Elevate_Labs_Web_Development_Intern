// ...existing code...
const apiBase = '/books';

let state = { page: 1, limit: 10, q: '' };

const elements = {
  booksList: document.getElementById('booksList'),
  stats: document.getElementById('stats'),
  addForm: document.getElementById('addForm'),
  title: document.getElementById('title'),
  author: document.getElementById('author'),
  year: document.getElementById('year'),
  search: document.getElementById('search'),
  prevPage: document.getElementById('prevPage'),
  nextPage: document.getElementById('nextPage'),
  pageInfo: document.getElementById('pageInfo'),
  toast: document.getElementById('toast'),
  refresh: document.getElementById('refresh')
};

async function fetchBooks(){
  const q = encodeURIComponent(state.q || '');
  const res = await fetch(`${apiBase}?q=${q}&page=${state.page}&limit=${state.limit}`);
  if(!res.ok){ showToast('Failed to load books', true); return { total:0, data:[] }; }
  return res.json();
}

function showToast(msg, isError=false){
  elements.toast.textContent = msg;
  elements.toast.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(()=> elements.toast.className = 'toast', 2500);
}

function renderBooks(data){
  elements.booksList.innerHTML = '';
  if(data.data.length === 0){
    elements.booksList.innerHTML = `<li class="book"><div class="meta"><h3>No books found</h3><p>Try adding one or change your search.</p></div></li>`;
    elements.stats.textContent = `Total: ${data.total}`;
    elements.pageInfo.textContent = `${state.page}`;
    return;
  }

  data.data.forEach(b => {
    const li = document.createElement('li');
    li.className = 'book';
    li.innerHTML = `
      <div class="meta">
        <h3>${escapeHtml(b.title)}</h3>
        <p>${escapeHtml(b.author)} ${b.year ? '• '+b.year : ''}</p>
      </div>
      <div class="actions">
        <button class="icon-btn edit" title="Edit"><i class="fas fa-edit"></i></button>
        <button class="icon-btn danger delete" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
    `;
    li.querySelector('.delete').addEventListener('click', ()=> deleteBook(b.id));
    li.querySelector('.edit').addEventListener('click', ()=> editBookPrompt(b));
    elements.booksList.appendChild(li);
  });

  elements.stats.textContent = `Total: ${data.total}`;
  elements.pageInfo.textContent = `${state.page}`;
}

async function loadAndRender(){
  const data = await fetchBooks();
  renderBooks(data);
}

async function addBook(e){
  e.preventDefault();
  const title = elements.title.value.trim();
  const author = elements.author.value.trim();
  const year = elements.year.value.trim();

  if(!title || !author){ showToast('Title and author required', true); return; }

  const res = await fetch(apiBase, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ title, author, year: year ? Number(year) : undefined })
  });
  if(!res.ok){ showToast('Failed to add book', true); return; }
  elements.addForm.reset();
  showToast('Book added');
  state.page = 1;
  loadAndRender();
}

async function deleteBook(id){
  if(!confirm('Delete this book?')) return;
  const res = await fetch(`${apiBase}/${id}`, { method: 'DELETE' });
  if(!res.ok){ showToast('Failed to delete', true); return; }
  showToast('Deleted');
  loadAndRender();
}

function editBookPrompt(book){
  const title = prompt('Title', book.title);
  if(title === null) return;
  const author = prompt('Author', book.author);
  if(author === null) return;
  const year = prompt('Year (empty to clear)', book.year || '');
  updateBook(book.id, title, author, year);
}

async function updateBook(id, title, author, year){
  const res = await fetch(`${apiBase}/${id}`, {
    method: 'PUT',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ title, author, year: year ? Number(year) : null })
  });
  if(!res.ok){ showToast('Failed to update', true); return; }
  showToast('Updated');
  loadAndRender();
}

elements.addForm.addEventListener('submit', addBook);
elements.search.addEventListener('input', (e)=>{
  state.q = e.target.value;
  state.page = 1;
  debounceLoad();
});
elements.prevPage.addEventListener('click', ()=>{
  if(state.page>1){ state.page--; loadAndRender(); }
});
elements.nextPage.addEventListener('click', ()=>{
  state.page++; loadAndRender();
});
elements.refresh.addEventListener('click', ()=> { state.q=''; elements.search.value=''; loadAndRender(); });

let debounceTimer;
function debounceLoad(){ clearTimeout(debounceTimer); debounceTimer = setTimeout(loadAndRender, 350); }

function escapeHtml(text){
  if(!text) return '';
  return text.replace(/[&<>"'`=\/]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;",'/':'&#x2F;','`':'&#x60;','=':'&#x3D;'})[s]);
}

// initial load
loadAndRender();
// ...existing code...