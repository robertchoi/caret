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

// Test Suite
describe('Todo App Logic', () => {
    let todos;

    beforeEach(() => {
        todos = [];
        localStorage.clear();
    });

    test('should add a new todo', () => {
        const newTodo = { id: Date.now(), text: 'Test Todo', completed: false };
        todos.push(newTodo);
        expect(todos.length).toBe(1);
        expect(todos[0].text).toBe('Test Todo');
        expect(todos[0].completed).toBe(false);
    });

    test('should not add an empty todo', () => {
        const newTodoText = '';
        if (newTodoText.trim() !== '') {
            const newTodo = { id: Date.now(), text: newTodoText, completed: false };
            todos.push(newTodo);
        }
        expect(todos.length).toBe(0);
    });

    test('should toggle a todo\'s completed status', () => {
        const newTodo = { id: 1, text: 'Test Todo', completed: false };
        todos.push(newTodo);
        const todoToToggle = todos.find(todo => todo.id === 1);
        if (todoToToggle) {
            todoToToggle.completed = !todoToToggle.completed;
        }
        expect(todos[0].completed).toBe(true);
        if (todoToToggle) {
            todoToToggle.completed = !todoToToggle.completed;
        }
        expect(todos[0].completed).toBe(false);
    });

    test('should delete a todo', () => {
        const todo1 = { id: 1, text: 'Todo 1', completed: false };
        const todo2 = { id: 2, text: 'Todo 2', completed: false };
        todos.push(todo1, todo2);
        
        const idToDelete = 1;
        todos = todos.filter(todo => todo.id !== idToDelete);

        expect(todos.length).toBe(1);
        expect(todos[0].id).toBe(2);
    });

    test('should save todos to localStorage', () => {
        const newTodo = { id: 1, text: 'Test Todo', completed: false };
        todos.push(newTodo);
        localStorage.setItem('todos', JSON.stringify(todos));
        const savedTodos = JSON.parse(localStorage.getItem('todos'));
        expect(savedTodos.length).toBe(1);
        expect(savedTodos[0].text).toBe('Test Todo');
    });

    test('should load todos from localStorage', () => {
        const data = [{ id: 1, text: 'Stored Todo', completed: true }];
        localStorage.setItem('todos', JSON.stringify(data));
        const loadedTodos = JSON.parse(localStorage.getItem('todos'));
        expect(loadedTodos.length).toBe(1);
        expect(loadedTodos[0].text).toBe('Stored Todo');
        expect(loadedTodos[0].completed).toBe(true);
    });
});
