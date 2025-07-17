document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todo-input');
    const addTodoButton = document.getElementById('add-todo-button');
    const todoList = document.getElementById('todo-list');

    const todoManager = new TodoManager();

    const renderTodos = () => {
        todoList.innerHTML = '';
        const todos = todoManager.getTodos();
        todos.forEach(todo => {
            const li = document.createElement('li');
            li.className = todo.completed ? 'completed' : '';
            li.dataset.id = todo.id;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.completed;
            checkbox.addEventListener('change', () => {
                todoManager.toggleTodo(todo.id);
                renderTodos();
            });

            const span = document.createElement('span');
            span.textContent = todo.text;

            const deleteButton = document.createElement('button');
            deleteButton.textContent = '삭제';
            deleteButton.addEventListener('click', () => {
                todoManager.deleteTodo(todo.id);
                renderTodos();
            });

            li.appendChild(checkbox);
            li.appendChild(span);
            li.appendChild(deleteButton);
            todoList.appendChild(li);
        });
    };

    addTodoButton.addEventListener('click', () => {
        const text = todoInput.value;
        if (todoManager.addTodo(text)) {
            todoInput.value = '';
            renderTodos();
        }
    });

    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodoButton.click();
        }
    });

    renderTodos();
});
