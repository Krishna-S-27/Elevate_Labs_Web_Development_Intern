class TodoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.initElements();
        this.attachEventListeners();
        this.updateDate();
        this.render();
    }

    initElements() {
        this.taskInput = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.totalCount = document.getElementById('totalCount');
        this.activeCount = document.getElementById('activeCount');
        this.completedCount = document.getElementById('completedCount');
        this.clearCompletedBtn = document.getElementById('clearCompletedBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.toast = document.getElementById('toast');
    }

    attachEventListeners() {
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.render();
            });
        });

        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        this.clearAllBtn.addEventListener('click', () => this.clearAll());
    }

    addTask() {
        const taskText = this.taskInput.value.trim();

        if (!taskText) {
            this.showToast('Please enter a task', 'error');
            return;
        }

        if (taskText.length > 100) {
            this.showToast('Task is too long (max 100 characters)', 'error');
            return;
        }

        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            priority: 'medium',
            createdAt: new Date().toLocaleString()
        };

        this.tasks.unshift(newTask);
        this.taskInput.value = '';
        this.taskInput.focus();
        this.showToast('Task added successfully', 'success');
        this.saveTasks();
        this.render();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.showToast('Task deleted', 'success');
        this.saveTasks();
        this.render();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }

    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        if (completedCount === 0) {
            this.showToast('No completed tasks to clear', 'error');
            return;
        }

        if (confirm(`Delete ${completedCount} completed task(s)?`)) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.showToast('Completed tasks cleared', 'success');
            this.saveTasks();
            this.render();
        }
    }

    clearAll() {
        if (this.tasks.length === 0) {
            this.showToast('No tasks to clear', 'error');
            return;
        }

        if (confirm(`Delete all ${this.tasks.length} task(s)? This cannot be undone.`)) {
            this.tasks = [];
            this.showToast('All tasks cleared', 'success');
            this.saveTasks();
            this.render();
        }
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const active = total - completed;

        this.totalCount.textContent = total;
        this.activeCount.textContent = active;
        this.completedCount.textContent = completed;
    }

    renderTasks() {
        this.taskList.innerHTML = '';
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            this.emptyState.classList.add('show');
            this.taskList.style.display = 'none';
            return;
        }

        this.emptyState.classList.remove('show');
        this.taskList.style.display = 'block';

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    ${task.completed ? 'checked' : ''} 
                    aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}"
                >
                <span class="task-text">${this.escapeHtml(task.text)}</span>
                <span class="task-priority priority-${task.priority}">${task.priority}</span>
                <button class="task-delete-btn" aria-label="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            `;

            const checkbox = li.querySelector('.task-checkbox');
            const deleteBtn = li.querySelector('.task-delete-btn');

            checkbox.addEventListener('change', () => this.toggleTask(task.id));
            deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

            this.taskList.appendChild(li);
        });
    }

    updateDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date().toLocaleDateString('en-US', options);
        document.getElementById('dateDisplay').textContent = today;
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem('tasks');
        return saved ? JSON.parse(saved) : [];
    }

    showToast(message, type = 'success') {
        this.toast.textContent = message;
        this.toast.className = `toast ${type} show`;

        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    render() {
        this.updateStats();
        this.renderTasks();
    }
}


document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();

});
