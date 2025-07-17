// Mock LocalStorage
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

// Test Suites
describe('Todo App Logic', () => {
    let todos;

    beforeEach(() => {
        todos = [];
        localStorage.clear();
    });

    // 1. addTodo
    test('should add a new todo to the list', () => {
        const newTodo = addTodo(todos, 'Test Todo');
        expect(newTodo).toHaveLength(1);
        expect(newTodo[0].text).toBe('Test Todo');
        expect(newTodo[0].completed).toBe(false);
    });

    test('should not add a todo if the text is empty', () => {
        const newTodo = addTodo(todos, '');
        expect(newTodo).toHaveLength(0);
    });

    // 2. deleteTodo
    test('should delete a todo from the list', () => {
        todos = [{ id: 1, text: 'Test Todo', completed: false }];
        const newTodo = deleteTodo(todos, 1);
        expect(newTodo).toHaveLength(0);
    });

    // 3. toggleTodo
    test('should toggle the completed status of a todo', () => {
        todos = [{ id: 1, text: 'Test Todo', completed: false }];
        const newTodo = toggleTodo(todos, 1);
        expect(newTodo[0].completed).toBe(true);
        const newTodo2 = toggleTodo(newTodo, 1);
        expect(newTodo2[0].completed).toBe(false);
    });

    // 4. saveTodos and loadTodos
    test('should save todos to localStorage', () => {
        const newTodos = [{ id: 1, text: 'Test Todo', completed: false }];
        saveTodos(newTodos);
        expect(localStorage.getItem('todos')).toBe(JSON.stringify(newTodos));
    });

    test('should load todos from localStorage', () => {
        const newTodos = [{ id: 1, text: 'Test Todo', completed: true }];
        localStorage.setItem('todos', JSON.stringify(newTodos));
        const loadedTodos = loadTodos();
        expect(loadedTodos).toEqual(newTodos);
    });

    test('should return an empty array if no todos in localStorage', () => {
        const loadedTodos = loadTodos();
        expect(loadedTodos).toEqual([]);
    });
});
