// script.js

class TodoList {
    constructor() {
        this.todos = this.loadTodos();
    }

    generateUniqueId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    addTodo(content) {
        if (!content || content.trim() === '') {
            return false;
        }
        const newTodo = {
            id: this.generateUniqueId(),
            content: content.trim(),
            completed: false
        };
        this.todos.push(newTodo);
        this.saveTodos();
        return true;
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            return true;
        }
        return false;
    }

    deleteTodo(id) {
        const initialLength = this.todos.length;
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveTodos();
        return this.todos.length < initialLength;
    }

    getTodos() {
        return this.todos;
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    loadTodos() {
        const todosJson = localStorage.getItem('todos');
        return todosJson ? JSON.parse(todosJson) : [];
    }
}

// 브라우저 환경에서 실행될 때만 UI 관련 코드 실행
if (typeof window !== 'undefined') {
    const todoList = new TodoList();

    document.addEventListener('DOMContentLoaded', () => {
        const todoInput = document.getElementById('todo-input');
        const addTodoButton = document.getElementById('add-todo-button');
        const todoListContainer = document.getElementById('todo-list');

        function renderTodos() {
            todoListContainer.innerHTML = '';
            const todos = todoList.getTodos();
            todos.forEach(todo => {
                const li = document.createElement('li');
                li.className = 'todo-item';
                if (todo.completed) {
                    li.classList.add('completed');
                }

                li.innerHTML = `
                    <input type="checkbox" data-id="${todo.id}" ${todo.completed ? 'checked' : ''}>
                    <span>${todo.content}</span>
                    <button data-id="${todo.id}">삭제</button>
                `;
                todoListContainer.appendChild(li);
            });
        }

        addTodoButton.addEventListener('click', () => {
            const content = todoInput.value;
            if (todoList.addTodo(content)) {
                todoInput.value = '';
                renderTodos();
            } else {
                alert('Todo 내용을 입력해주세요.');
            }
        });

        todoListContainer.addEventListener('change', (event) => {
            if (event.target.type === 'checkbox') {
                const id = event.target.dataset.id;
                todoList.toggleTodo(id);
                renderTodos();
            }
        });

        todoListContainer.addEventListener('click', (event) => {
            if (event.target.tagName === 'BUTTON') {
                const id = event.target.dataset.id;
                todoList.deleteTodo(id);
                renderTodos();
            }
        });

        renderTodos(); // 초기 로드 시 Todo 리스트 렌더링
    });
}

// Node.js 환경에서 테스트를 위해 모듈로 내보냄
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TodoList;
}
