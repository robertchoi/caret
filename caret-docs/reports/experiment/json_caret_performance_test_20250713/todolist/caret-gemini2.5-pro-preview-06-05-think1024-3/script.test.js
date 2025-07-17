const todoManager = require('./todoManager');

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key) => {
      delete store[key];
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Todo Manager', () => {
  beforeEach(() => {
    window.localStorage.clear();
    todoManager.todos = [];
  });

  test('should add a new todo', () => {
    todoManager.addTodo('Test Todo');
    expect(todoManager.todos.length).toBe(1);
    expect(todoManager.todos[0].text).toBe('Test Todo');
    expect(todoManager.todos[0].completed).toBe(false);
  });

  test('should toggle a todo', () => {
    todoManager.addTodo('Test Todo');
    const todoId = todoManager.todos[0].id;
    todoManager.toggleTodo(todoId);
    expect(todoManager.todos[0].completed).toBe(true);
    todoManager.toggleTodo(todoId);
    expect(todoManager.todos[0].completed).toBe(false);
  });

  test('should delete a todo', () => {
    todoManager.addTodo('Test Todo');
    const todoId = todoManager.todos[0].id;
    todoManager.deleteTodo(todoId);
    expect(todoManager.todos.length).toBe(0);
  });

  test('should save todos to localStorage', () => {
    todoManager.addTodo('Test Todo 1');
    todoManager.addTodo('Test Todo 2');
    todoManager.saveTodos();
    const savedTodos = JSON.parse(window.localStorage.getItem('todos'));
    expect(savedTodos.length).toBe(2);
    expect(savedTodos[0].text).toBe('Test Todo 1');
  });

  test('should load todos from localStorage', () => {
    const sampleTodos = [{ id: 1, text: 'Loaded Todo', completed: false }];
    window.localStorage.setItem('todos', JSON.stringify(sampleTodos));
    todoManager.loadTodos();
    expect(todoManager.todos.length).toBe(1);
    expect(todoManager.todos[0].text).toBe('Loaded Todo');
  });
});
