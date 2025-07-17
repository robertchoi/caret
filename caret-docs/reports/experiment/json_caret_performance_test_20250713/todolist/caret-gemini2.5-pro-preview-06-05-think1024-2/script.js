import TodoManager from './todoManager.js';

document.addEventListener('DOMContentLoaded', () => {
  const todoForm = document.getElementById('todo-form');
  const todoInput = document.getElementById('todo-input');
  const todoList = document.getElementById('todo-list');

  const todoManager = new TodoManager();

  const renderTodos = () => {
    todoList.innerHTML = '';
    const todos = todoManager.getTodos();
    todos.forEach(todo => {
      const li = document.createElement('li');
      li.dataset.id = todo.id;
      if (todo.completed) {
        li.classList.add('completed');
      }

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

  todoForm.addEventListener('submit', e => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (text) {
      todoManager.addTodo(text);
      todoInput.value = '';
      renderTodos();
    }
  });

  renderTodos();
});
