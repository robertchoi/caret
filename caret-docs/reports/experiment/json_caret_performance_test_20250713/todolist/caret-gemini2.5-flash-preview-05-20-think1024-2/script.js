// script.js

class TodoManager {
    constructor() {
        this.todos = this.loadTodos();
    }

    addTodo(text) {
        if (!text || text.trim() === '') {
            throw new Error('Todo content cannot be empty.');
        }
        const newTodo = {
            id: Date.now().toString(),
            text: text.trim(),
            completed: false
        };
        this.todos.push(newTodo);
        this.saveTodos();
        return newTodo;
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
        }
    }

    deleteTodo(id) {
        const index = this.todos.findIndex(t => t.id === id);
        if (index > -1) {
            this.todos.splice(index, 1);
            this.saveTodos();
            return true;
        }
        return false;
    }

    getTodos() {
        return [...this.todos];
    }

    saveTodos() {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('todos', JSON.stringify(this.todos));
        }
    }

    loadTodos() {
        if (typeof localStorage !== 'undefined') {
            const storedTodos = localStorage.getItem('todos');
            return storedTodos ? JSON.parse(storedTodos) : [];
        }
        return [];
    }
}

// UI 관련 로직
document.addEventListener('DOMContentLoaded', () => {
    const todoManager = new TodoManager();
    const todoInput = document.getElementById('todo-input');
    const addTodoBtn = document.getElementById('add-todo-btn');
    const todoListUl = document.getElementById('todo-list');

    function renderTodos() {
        todoListUl.innerHTML = ''; // Clear existing list
        const todos = todoManager.getTodos();
        todos.forEach(todo => {
            const listItem = document.createElement('li');
            listItem.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            listItem.dataset.id = todo.id;

            listItem.innerHTML = `
                <input type="checkbox" ${todo.completed ? 'checked' : ''}>
                <span class="todo-text">${todo.text}</span>
                <button class="delete-btn">삭제</button>
            `;

            const checkbox = listItem.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => {
                todoManager.toggleTodo(todo.id);
                renderTodos(); // Re-render to update UI
            });

            const deleteButton = listItem.querySelector('.delete-btn');
            deleteButton.addEventListener('click', () => {
                todoManager.deleteTodo(todo.id);
                renderTodos(); // Re-render to update UI
            });

            todoListUl.appendChild(listItem);
        });
    }

    addTodoBtn.addEventListener('click', () => {
        const text = todoInput.value.trim();
        if (text) {
            try {
                todoManager.addTodo(text);
                todoInput.value = ''; // Clear input
                renderTodos();
            } catch (error) {
                alert(error.message); // Show error for empty todo
            }
        } else {
            alert('할 일을 입력해주세요.');
        }
    });

    // Enter 키로 Todo 추가
    todoInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addTodoBtn.click();
        }
    });

    // Initial render
    renderTodos();
});

// CommonJS 모듈 시스템을 사용하는 Node.js 환경을 위해 export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TodoManager;
}
