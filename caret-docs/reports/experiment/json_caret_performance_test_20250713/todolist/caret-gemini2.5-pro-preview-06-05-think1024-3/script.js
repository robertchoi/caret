document.addEventListener('DOMContentLoaded', () => {
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');

    const renderTodos = () => {
        todoList.innerHTML = '';
        todoManager.todos.forEach(todo => {
            const li = document.createElement('li');
            li.className = todo.completed ? 'completed' : '';
            li.dataset.id = todo.id;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.completed;
            checkbox.addEventListener('change', () => {
                todoManager.toggleTodo(todo.id);
                todoManager.saveTodos();
                renderTodos();
            });

            const span = document.createElement('span');
            span.textContent = todo.text;

            const deleteButton = document.createElement('button');
            deleteButton.textContent = '삭제';
            deleteButton.addEventListener('click', () => {
                todoManager.deleteTodo(todo.id);
                todoManager.saveTodos();
                renderTodos();
            });

            li.appendChild(checkbox);
            li.appendChild(span);
            li.appendChild(deleteButton);
            todoList.appendChild(li);
        });
    };

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = todoInput.value.trim();
        if (text !== '') {
            todoManager.addTodo(text);
            todoManager.saveTodos();
            renderTodos();
            todoInput.value = '';
        }
    });

    // 초기 로드
    todoManager.loadTodos();
    renderTodos();
});
