// Mock LocalStorage for testing environment
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

// Simple Test Runner
const test = (description, fn) => {
    console.log(`🧪 ${description}`);
    try {
        fn();
        console.log('   ✅ Test passed');
    } catch (error) {
        console.error('   ❌ Test failed:', error.message);
    }
};

const assert = (condition, message) => {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
};

// --- Test Suite ---

test('addTodo should add a new todo item', () => {
    todos = [];
    addTodo('Test new todo');
    assert(todos.length === 1, 'Expected todos length to be 1');
    assert(todos[0].text === 'Test new todo', 'Expected todo text to be correct');
    assert(todos[0].completed === false, 'Expected new todo to be incomplete');
});

test('addTodo should not add an empty todo', () => {
    todos = [];
    addTodo('');
    addTodo('   '); // whitespace
    assert(todos.length === 0, 'Expected todos length to be 0 for empty input');
});

test('deleteTodo should remove a todo item by id', () => {
    todos = [{ id: 1, text: 'Initial todo', completed: false }];
    deleteTodo(1);
    assert(todos.length === 0, 'Expected todo to be deleted');
});

test('deleteTodo should not fail for a non-existent id', () => {
    todos = [{ id: 1, text: 'Initial todo', completed: false }];
    deleteTodo(999); // non-existent id
    assert(todos.length === 1, 'Expected todo list to remain unchanged');
});

test('toggleTodo should switch the completed status', () => {
    todos = [{ id: 1, text: 'Toggle me', completed: false }];
    toggleTodo(1);
    assert(todos[0].completed === true, 'Expected todo to be completed');
    toggleTodo(1);
    assert(todos[0].completed === false, 'Expected todo to be incomplete again');
});

test('saveTodos and loadTodos should persist data to localStorage', () => {
    const testTodos = [{ id: Date.now(), text: 'Persist me', completed: true }];
    todos = testTodos;

    // 1. Save
    saveTodos();
    const saved = localStorage.getItem('todos');
    assert(saved !== null, 'Expected todos to be saved in localStorage');
    assert(saved === JSON.stringify(testTodos), 'Saved data should match original data');

    // 2. Load
    todos = []; // Clear current todos
    loadTodos();
    assert(todos.length === 1, 'Expected to load 1 todo from localStorage');
    assert(todos[0].text === 'Persist me', 'Loaded todo text should match');
    assert(todos[0].completed === true, 'Loaded todo completed status should match');

    // Clean up
    localStorage.clear();
});

test('loadTodos should handle empty localStorage', () => {
    localStorage.clear();
    loadTodos();
    assert(Array.isArray(todos), 'todos should be an array');
    assert(todos.length === 0, 'todos should be empty when localStorage is empty');
});
