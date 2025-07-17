// script.js
// Todo 리스트 애플리케이션의 UI 로직

import { TodoManager } from './todoManager.js';

document.addEventListener('DOMContentLoaded', () => {
    const todoManager = new TodoManager();
    const todoInput = document.getElementById('todo-input');
    const addTodoButton = document.getElementById('add-todo-button');
    const todoList = document.getElementById('todo-list');

    function renderTodos() {
        todoList.innerHTML = ''; // 기존 목록 비우기
        todoManager.todos.forEach(todo => {
            const listItem = document.createElement('li');
            listItem.className = 'todo-item';
            if (todo.completed) {
                listItem.classList.add('completed');
            }

            listItem.dataset.id = todo.id; // 데이터 ID 설정

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.completed;
            checkbox.addEventListener('change', () => {
                todoManager.toggleTodo(todo.id);
                renderTodos(); // 상태 변경 후 다시 렌더링
            });

            const contentSpan = document.createElement('span');
            contentSpan.textContent = todo.content;
            contentSpan.className = 'todo-content';

            const deleteButton = document.createElement('button');
            deleteButton.textContent = '삭제';
            deleteButton.className = 'delete-button';
            deleteButton.addEventListener('click', () => {
                todoManager.deleteTodo(todo.id);
                renderTodos(); // 삭제 후 다시 렌더링
            });

            listItem.appendChild(checkbox);
            listItem.appendChild(contentSpan);
            listItem.appendChild(deleteButton);
            todoList.appendChild(listItem);
        });
    }

    addTodoButton.addEventListener('click', () => {
        const content = todoInput.value;
        try {
            todoManager.addTodo(content);
            todoInput.value = ''; // 입력 필드 초기화
            renderTodos(); // 새 항목 추가 후 다시 렌더링
        } catch (error) {
            alert(error.message); // 사용자에게 에러 메시지 표시
        }
    });

    // 초기 렌더링
    renderTodos();
});
