let todos = [];

function addTodo(text) {
    if (!text || !text.trim()) {
        return;
    }

    const newTodo = {
        id: Date.now(),
        text: text.trim(),
        completed: false,
    };
    todos.push(newTodo);
}

function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
}

function toggleTodo(id) {
    const todo = todos.find(todo => todo.id === id);
    if (todo) {
        todo.completed = !todo.completed;
    }
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function loadTodos() {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
        todos = JSON.parse(savedTodos);
    } else {
        todos = [];
    }
}

// --- UI Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');

    function renderTodos() {
        todoList.innerHTML = ''; // Clear the list
        todos.forEach(todo => {
            const li = document.createElement('li');
            li.className = todo.completed ? 'completed' : '';
            li.dataset.id = todo.id;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.completed;
            checkbox.addEventListener('change', () => {
                toggleTodo(todo.id);
                saveTodos();
                renderTodos();
            });

            const text = document.createElement('span');
            text.textContent = todo.text;

            const deleteButton = document.createElement('button');
            deleteButton.textContent = '삭제';
            deleteButton.addEventListener('click', () => {
                deleteTodo(todo.id);
                saveTodos();
                renderTodos();
            });

            li.appendChild(checkbox);
            li.appendChild(text);
            li.appendChild(deleteButton);
            todoList.appendChild(li);
        });
    }

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTodo(todoInput.value);
        saveTodos();
        renderTodos();
        todoInput.value = '';
        todoInput.focus();
    });

    // Initial Load
    loadTodos();
    renderTodos();
});
