let todos = [];

function addTodo(currentTodos, text) {
    if (!text.trim()) {
        return currentTodos;
    }
    const newTodo = {
        id: Date.now(),
        text: text,
        completed: false
    };
    return [...currentTodos, newTodo];
}

function deleteTodo(currentTodos, id) {
    return currentTodos.filter(todo => todo.id !== id);
}

function toggleTodo(currentTodos, id) {
    return currentTodos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
}

function saveTodos(currentTodos) {
    localStorage.setItem('todos', JSON.stringify(currentTodos));
}

function loadTodos() {
    const todosString = localStorage.getItem('todos');
    return todosString ? JSON.parse(todosString) : [];
}

document.addEventListener('DOMContentLoaded', () => {
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');

    todos = loadTodos();
    renderTodos();

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = todoInput.value;
        todos = addTodo(todos, text);
        saveTodos(todos);
        renderTodos();
        todoInput.value = '';
    });

    function renderTodos() {
        todoList.innerHTML = '';
        todos.forEach(todo => {
            const li = document.createElement('li');
            li.className = todo.completed ? 'completed' : '';
            li.innerHTML = `
                <input type="checkbox" ${todo.completed ? 'checked' : ''}>
                <span>${todo.text}</span>
                <button>삭제</button>
            `;

            li.querySelector('input').addEventListener('change', () => {
                todos = toggleTodo(todos, todo.id);
                saveTodos(todos);
                renderTodos();
            });

            li.querySelector('button').addEventListener('click', () => {
                todos = deleteTodo(todos, todo.id);
                saveTodos(todos);
                renderTodos();
            });

            todoList.appendChild(li);
        });
    }
});
