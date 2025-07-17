// script.test.js

// TodoManager 클래스를 테스트하기 위한 간단한 테스트 프레임워크
const assert = {
    strictEqual: (actual, expected, message) => {
        if (actual !== expected) {
            throw new Error(`Assertion Failed: ${message || ''} Expected ${expected}, got ${actual}`);
        }
    },
    deepStrictEqual: (actual, expected, message) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`Assertion Failed: ${message || ''} Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        }
    },
    throws: (fn, errorType, message) => {
        let thrown = false;
        try {
            fn();
        } catch (e) {
            thrown = true;
            if (errorType && !(e instanceof errorType)) {
                throw new Error(`Assertion Failed: ${message || ''} Expected error of type ${errorType.name}, but got ${e.constructor.name}`);
            }
        }
        if (!thrown) {
            throw new Error(`Assertion Failed: ${message || ''} Expected an error to be thrown, but none was.`);
        }
    }
};

let currentBeforeEach = [];

function describe(description, callback) {
    console.log(`\n${description}`);
    const parentBeforeEach = currentBeforeEach;
    currentBeforeEach = []; // Reset for nested describes if any
    callback();
    currentBeforeEach = parentBeforeEach; // Restore parent beforeEach
}

function it(description, callback) {
    try {
        currentBeforeEach.forEach(fn => fn()); // Run beforeEach callbacks
        callback();
        console.log(`  ✓ ${description}`);
    } catch (error) {
        console.error(`  ✗ ${description}`);
        console.error(error);
        process.exit(1); // 테스트 실패 시 프로세스 종료
    }
}

function beforeEach(callback) {
    currentBeforeEach.push(callback);
}

const TodoManager = require('./script.js');

// Mock localStorage for testing in Node.js environment
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: function(key) {
            return store[key] || null;
        },
        setItem: function(key, value) {
            store[key] = value.toString();
        },
        clear: function() {
            store = {};
        },
        removeItem: function(key) {
            delete store[key];
        }
    };
})();

// Node.js 환경에서 실행될 때만 localStorage를 모의 객체로 대체
if (typeof global !== 'undefined') {
    global.localStorage = localStorageMock;
}

// 테스트 스위트
describe('TodoManager', () => {
    let todoManager;

    beforeEach(() => {
        localStorage.clear(); // 각 테스트 전에 localStorage 초기화
        todoManager = new TodoManager();
    });

    it('should add a new todo item', () => {
        const todo = todoManager.addTodo('Learn TDD');
        assert.strictEqual(todoManager.getTodos().length, 1, 'Todo should be added');
        assert.strictEqual(todo.text, 'Learn TDD', 'Todo text should match');
        assert.strictEqual(todo.completed, false, 'Todo should not be completed initially');
    });

    it('should not add an empty todo item', () => {
        assert.throws(() => todoManager.addTodo(''), Error, 'Should throw error for empty string');
        assert.throws(() => todoManager.addTodo('   '), Error, 'Should throw error for whitespace string');
        assert.strictEqual(todoManager.getTodos().length, 0, 'No todo should be added');
    });

    it('should toggle the completion status of a todo item', () => {
        const todo1 = todoManager.addTodo('Buy groceries');
        todoManager.toggleTodo(todo1.id);
        assert.strictEqual(todoManager.getTodos()[0].completed, true, 'Todo should be completed');

        todoManager.toggleTodo(todo1.id);
        assert.strictEqual(todoManager.getTodos()[0].completed, false, 'Todo should be uncompleted');
    });

    it('should delete a todo item', () => {
        const todo1 = todoManager.addTodo('Task 1');
        const todo2 = todoManager.addTodo('Task 2');
        const deleted = todoManager.deleteTodo(todo1.id);
        assert.strictEqual(deleted, true, 'deleteTodo should return true on successful deletion');
        assert.strictEqual(todoManager.getTodos().length, 1, 'One todo should be deleted');
        assert.strictEqual(todoManager.getTodos()[0].text, 'Task 2', 'Correct todo should remain');
    });

    it('should load todos from localStorage on initialization', () => {
        localStorage.setItem('todos', JSON.stringify([{
            id: '1',
            text: 'Loaded Todo',
            completed: false
        }]));
        const newManager = new TodoManager();
        assert.strictEqual(newManager.getTodos().length, 1, 'Should load 1 todo from localStorage');
        assert.strictEqual(newManager.getTodos()[0].text, 'Loaded Todo', 'Loaded todo text should match');
    });

    it('should save todos to localStorage after modification', () => {
        todoManager.addTodo('Save this');
        const stored = localStorage.getItem('todos');
        assert.deepStrictEqual(JSON.parse(stored)[0].text, 'Save this', 'Todo should be saved to localStorage');
    });

    it('should return a copy of todos array', () => {
        todoManager.addTodo('Original');
        const todos = todoManager.getTodos();
        todos.push({ id: 'new', text: 'Modified', completed: false }); // Modify the copy
        assert.strictEqual(todoManager.getTodos().length, 1, 'Original todos array should not be modified');
    });
});
