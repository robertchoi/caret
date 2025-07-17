// script.js

const TodoManager = (function() {
    const STORAGE_KEY = 'todos';
    let todos = [];

    function loadTodos() {
        const storedTodos = localStorage.getItem(STORAGE_KEY);
        todos = storedTodos ? JSON.parse(storedTodos) : [];
    }

    function saveTodos() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }

    function addTodo(text) {
        if (!text || text.trim() === '') {
            return false;
        }
        const newTodo = {
            id: Date.now(),
            text: text.trim(),
            completed: false
        };
        todos.push(newTodo);
        saveTodos();
        return true;
    }

    function toggleTodo(id) {
        const todo = todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            saveTodos();
            return true;
        }
        return false;
    }

    function deleteTodo(id) {
        const initialLength = todos.length;
        todos = todos.filter(t => t.id !== id);
        saveTodos();
        return todos.length < initialLength;
    }

    function getTodos() {
        return [...todos]; // 불변성을 위해 복사본 반환
    }

    function clearAllTodos() {
        todos = [];
        localStorage.clear();
    }

    return {
        loadTodos,
        addTodo,
        toggleTodo,
        deleteTodo,
        getTodos,
        clearAllTodos // 테스트를 위해 추가
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todo-input');
    const addTodoButton = document.getElementById('add-todo-button');
    const todoList = document.getElementById('todo-list');

    TodoManager.loadTodos();
    renderTodos();

    addTodoButton.addEventListener('click', () => {
        const text = todoInput.value;
        if (TodoManager.addTodo(text)) {
            todoInput.value = '';
            renderTodos();
        }
    });

    todoInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addTodoButton.click();
        }
    });

    function renderTodos() {
        todoList.innerHTML = '';
        const todos = TodoManager.getTodos();
        todos.forEach(todo => {
            const listItem = document.createElement('li');
            listItem.className = 'todo-item';
            if (todo.completed) {
                listItem.classList.add('completed');
            }

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.completed;
            checkbox.addEventListener('change', () => {
                TodoManager.toggleTodo(todo.id);
                renderTodos();
            });

            const todoText = document.createElement('span');
            todoText.textContent = todo.text;
            todoText.className = 'todo-text';
            todoText.addEventListener('click', () => { // 텍스트 클릭으로 토글 기능 추가
                TodoManager.toggleTodo(todo.id);
                renderTodos();
            });

            const deleteButton = document.createElement('button');
            deleteButton.textContent = '삭제';
            deleteButton.className = 'delete-button';
            deleteButton.addEventListener('click', () => {
                TodoManager.deleteTodo(todo.id);
                renderTodos();
            });

            listItem.appendChild(checkbox);
            listItem.appendChild(todoText);
            listItem.appendChild(deleteButton);
            todoList.appendChild(listItem);
        });
    }
});
