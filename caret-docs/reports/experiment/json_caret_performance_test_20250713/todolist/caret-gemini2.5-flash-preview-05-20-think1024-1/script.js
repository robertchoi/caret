// script.js

// localStorage에서 Todo 항목을 로드하거나 초기화합니다.
const loadTodos = () => {
    const todosJson = localStorage.getItem('todos');
    return todosJson ? JSON.parse(todosJson) : [];
};

// Todo 항목을 localStorage에 저장합니다.
const saveTodos = (todos) => {
    localStorage.setItem('todos', JSON.stringify(todos));
};

// 새로운 Todo 항목을 추가합니다.
const addTodo = (content) => {
    if (!content.trim()) {
        return; // 빈 내용은 추가하지 않습니다.
    }
    const todos = loadTodos(); // 최신 todos를 로드
    const newTodo = {
        id: Date.now().toString(), // 고유 ID 생성
        content: content.trim(),
        completed: false
    };
    todos.push(newTodo);
    saveTodos(todos);
};

// 모든 Todo 항목을 반환합니다.
const getTodos = () => {
    return loadTodos();
};

// 특정 Todo 항목의 완료 상태를 토글합니다.
const toggleTodo = (id) => {
    let todos = loadTodos(); // 최신 todos를 로드
    todos = todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos(todos);
};

// 특정 Todo 항목을 삭제합니다.
const deleteTodo = (id) => {
    let todos = loadTodos(); // 최신 todos를 로드
    todos = todos.filter(todo => todo.id !== id);
    saveTodos(todos);
};

// UI 렌더링 함수 (브라우저 환경에서만 사용)
const renderTodos = () => {
    const todoListElement = document.getElementById('todo-list');
    if (!todoListElement) return; // DOM이 없는 환경에서는 실행하지 않음

    todoListElement.innerHTML = ''; // 기존 목록 초기화
    todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = todo.completed ? 'completed' : '';
        li.innerHTML = `
            <input type="checkbox" ${todo.completed ? 'checked' : ''} data-id="${todo.id}">
            <span>${todo.content}</span>
            <button data-id="${todo.id}">삭제</button>
        `;
        todoListElement.appendChild(li);
    });
};

// 이벤트 리스너 설정 (브라우저 환경에서만 사용)
const setupEventListeners = () => {
    const addButton = document.getElementById('add-button');
    const todoInput = document.getElementById('todo-input');
    const todoListElement = document.getElementById('todo-list');

    if (addButton) {
        addButton.addEventListener('click', () => {
            addTodo(todoInput.value);
            todoInput.value = '';
            renderTodos();
        });
    }

    if (todoListElement) {
        todoListElement.addEventListener('click', (e) => {
            if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
                toggleTodo(e.target.dataset.id);
                renderTodos();
            } else if (e.target.tagName === 'BUTTON') {
                deleteTodo(e.target.dataset.id);
                renderTodos();
            }
        });
    }
};

// 페이지 로드 시 초기화 (브라우저 환경에서만 실행)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        todos = loadTodos(); // 초기 로드
        renderTodos();
        setupEventListeners();
    });
}
