// script.test.js
// Todo 관리 로직에 대한 테스트 코드

// script.test.js
// Todo 관리 로직에 대한 테스트 코드

// todoManager.js에서 TodoManager 클래스를 가져옵니다.
const { TodoManager } = require('./todoManager.js');

describe('TodoManager', () => {
    let todoManager;

    beforeEach(() => {
        // 각 테스트 전에 localStorage 초기화
        // Jest의 jsdom 환경은 localStorage를 제공하므로 직접 mock할 필요가 없습니다.
        localStorage.clear();
        todoManager = new TodoManager();
    });

    test('should load todos from localStorage on initialization', () => {
        const initialTodos = [{ id: 1, content: 'Test Todo', completed: false }];
        localStorage.setItem('todos', JSON.stringify(initialTodos));
        todoManager = new TodoManager(); // 다시 초기화하여 로드 확인
        expect(todoManager.todos).toEqual(initialTodos);
    });

    test('should add a new todo item', () => {
        const newTodo = todoManager.addTodo('Learn TDD');
        expect(todoManager.todos.length).toBe(1);
        expect(todoManager.todos[0].content).toBe('Learn TDD');
        expect(todoManager.todos[0].completed).toBe(false);
        expect(newTodo).toEqual(todoManager.todos[0]); // 반환된 객체가 추가된 객체와 동일한지 확인
    });

    test('should not add an empty todo item', () => {
        expect(() => todoManager.addTodo('')).toThrow('Todo content cannot be empty.');
        expect(() => todoManager.addTodo('   ')).toThrow('Todo content cannot be empty.');
        expect(todoManager.todos.length).toBe(0);
    });

    test('should toggle the completed status of a todo item', () => {
        const todo = todoManager.addTodo('Buy groceries');
        todoManager.toggleTodo(todo.id);
        expect(todoManager.todos[0].completed).toBe(true);
        todoManager.toggleTodo(todo.id);
        expect(todoManager.todos[0].completed).toBe(false);
    });

    test('should return true when toggling an existing todo', () => {
        const todo = todoManager.addTodo('Existing todo');
        expect(todoManager.toggleTodo(todo.id)).toBe(true);
    });

    test('should return false when toggling a non-existent todo', () => {
        expect(todoManager.toggleTodo(999)).toBe(false);
    });

    test('should delete a todo item', () => {
        const todo1 = todoManager.addTodo('Todo 1');
        const todo2 = todoManager.addTodo('Todo 2');
        todoManager.deleteTodo(todo1.id);
        expect(todoManager.todos.length).toBe(1);
        expect(todoManager.todos[0].content).toBe('Todo 2');
    });

    test('should return true when deleting an existing todo', () => {
        const todo = todoManager.addTodo('Existing todo');
        expect(todoManager.deleteTodo(todo.id)).toBe(true);
    });

    test('should return false when deleting a non-existent todo', () => {
        todoManager.addTodo('Existing todo');
        expect(todoManager.deleteTodo(999)).toBe(false);
        expect(todoManager.todos.length).toBe(1); // 길이가 변하지 않아야 함
    });

    test('should save todos to localStorage after adding', () => {
        todoManager.addTodo('Save me');
        expect(localStorage.getItem('todos')).toBe(JSON.stringify(todoManager.todos));
    });

    test('should save todos to localStorage after toggling', () => {
        const todo = todoManager.addTodo('Toggle me');
        todoManager.toggleTodo(todo.id);
        expect(localStorage.getItem('todos')).toBe(JSON.stringify(todoManager.todos));
    });

    test('should save todos to localStorage after deleting', () => {
        const todo = todoManager.addTodo('Delete me');
        todoManager.deleteTodo(todo.id);
        expect(localStorage.getItem('todos')).toBe(JSON.stringify(todoManager.todos));
    });

    test('should return empty array if no todos in localStorage', () => {
        localStorage.clear();
        todoManager = new TodoManager();
        expect(todoManager.todos).toEqual([]);
    });
});
