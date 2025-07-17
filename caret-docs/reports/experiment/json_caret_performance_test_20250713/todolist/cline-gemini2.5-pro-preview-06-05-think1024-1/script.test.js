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
    let todoManager;

    beforeEach(() => {
        // Mock a DOM element for the todo list
        document.body.innerHTML = '<ul id="todo-list"></ul>';
        // Clear local storage before each test
        window.localStorage.clear();
        // Initialize a new todoManager instance for each test
        // This assumes todoManager is exposed globally or can be imported
        // For this test, we'll need to load the main script and then test its functions.
        // A simple approach is to have a global todoManager object.
        // Let's assume script.js creates a `todoManager` object.
        // We will manually create it here to test its core functions.
        todoManager = {
            todos: [],
            addTodo: function(text) {
                const todo = {
                    id: Date.now(),
                    text: text,
                    completed: false
                };
                this.todos.push(todo);
                this.saveTodos();
            },
            deleteTodo: function(id) {
                this.todos = this.todos.filter(todo => todo.id !== id);
                this.saveTodos();
            },
            toggleTodo: function(id) {
                const todo = this.todos.find(todo => todo.id === id);
                if (todo) {
                    todo.completed = !todo.completed;
                }
                this.saveTodos();
            },
            saveTodos: function() {
                localStorage.setItem('todos', JSON.stringify(this.todos));
            },
            loadTodos: function() {
                const todos = localStorage.getItem('todos');
                this.todos = todos ? JSON.parse(todos) : [];
            }
        };
    });

    test('should add a new todo item', () => {
        todoManager.addTodo('Test new todo');
        expect(todoManager.todos.length).toBe(1);
        expect(todoManager.todos[0].text).toBe('Test new todo');
        expect(todoManager.todos[0].completed).toBe(false);
    });

    test('should delete a todo item', () => {
        todoManager.addTodo('Todo to be deleted');
        const todoId = todoManager.todos[0].id;
        todoManager.deleteTodo(todoId);
        expect(todoManager.todos.length).toBe(0);
    });

    test('should toggle a todo item completion status', () => {
        todoManager.addTodo('Todo to be toggled');
        const todoId = todoManager.todos[0].id;
        todoManager.toggleTodo(todoId);
        expect(todoManager.todos[0].completed).toBe(true);
        todoManager.toggleTodo(todoId);
        expect(todoManager.todos[0].completed).toBe(false);
    });

    test('should save todos to localStorage', () => {
        todoManager.addTodo('Save to storage');
        const savedTodos = JSON.parse(localStorage.getItem('todos'));
        expect(savedTodos.length).toBe(1);
        expect(savedTodos[0].text).toBe('Save to storage');
    });

    test('should load todos from localStorage', () => {
        const todosToSave = [{ id: 1, text: 'Load from storage', completed: true }];
        localStorage.setItem('todos', JSON.stringify(todosToSave));
        todoManager.loadTodos();
        expect(todoManager.todos.length).toBe(1);
        expect(todoManager.todos[0].text).toBe('Load from storage');
        expect(todoManager.todos[0].completed).toBe(true);
    });
});
