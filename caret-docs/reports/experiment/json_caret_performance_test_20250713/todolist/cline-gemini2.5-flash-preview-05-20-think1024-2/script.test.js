// script.test.js

// Todo 관리 로직을 테스트하기 위한 가상의 localStorage 구현
const localStorageMock = (function() {
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

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Todo 관리 함수들을 테스트하기 위한 모듈
const TodoManager = (function() {
    const STORAGE_KEY = 'todos';

    let todos = [];

    function loadTodos() {
        const storedTodos = localStorage.getItem(STORAGE_KEY);
        todos = storedTodos ? JSON.parse(storedTodos) : [];
    }

    function saveTodos() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }

    function addTodo(text) {
        if (!text || text.trim() === '') {
            return false;
        }
        const newTodo = {
            id: Date.now(),
            text: text.trim(),
            completed: false
        };
        todos.push(newTodo);
        saveTodos();
        return true;
    }

    function toggleTodo(id) {
        const todo = todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            saveTodos();
            return true;
        }
        return false;
    }

    function deleteTodo(id) {
        const initialLength = todos.length;
        todos = todos.filter(t => t.id !== id);
        saveTodos();
        return todos.length < initialLength;
    }

    function getTodos() {
        return [...todos]; // 불변성을 위해 복사본 반환
    }

    function clearAllTodos() {
        todos = [];
        localStorage.clear();
    }

    return {
        loadTodos,
        addTodo,
        toggleTodo,
        deleteTodo,
        getTodos,
        clearAllTodos
    };
})();

// 테스트 스위트
describe('TodoManager', () => {
    beforeEach(() => {
        // 각 테스트 전에 localStorage를 초기화
        TodoManager.clearAllTodos();
    });

    test('새로운 Todo 항목이 올바르게 추가되는지', () => {
        expect(TodoManager.addTodo('테스트 Todo 1')).toBe(true);
        expect(TodoManager.getTodos().length).toBe(1);
        expect(TodoManager.getTodos()[0].text).toBe('테스트 Todo 1');
        expect(TodoManager.getTodos()[0].completed).toBe(false);
    });

    test('빈 내용은 Todo 항목으로 추가되지 않는지', () => {
        expect(TodoManager.addTodo('')).toBe(false);
        expect(TodoManager.addTodo('   ')).toBe(false);
        expect(TodoManager.getTodos().length).toBe(0);
    });

    test('Todo 항목의 완료 상태가 올바르게 토글되는지', () => {
        TodoManager.addTodo('테스트 Todo 2');
        const todoId = TodoManager.getTodos()[0].id;

        expect(TodoManager.getTodos()[0].completed).toBe(false);
        expect(TodoManager.toggleTodo(todoId)).toBe(true);
        expect(TodoManager.getTodos()[0].completed).toBe(true);
        expect(TodoManager.toggleTodo(todoId)).toBe(true);
        expect(TodoManager.getTodos()[0].completed).toBe(false);
    });

    test('존재하지 않는 Todo 항목의 완료 상태를 토글하려고 할 때 false를 반환하는지', () => {
        expect(TodoManager.toggleTodo(999)).toBe(false);
    });

    test('Todo 항목이 올바르게 삭제되는지', () => {
        TodoManager.addTodo('테스트 Todo 3');
        const todoId = TodoManager.getTodos()[0].id;

        expect(TodoManager.getTodos().length).toBe(1);
        expect(TodoManager.deleteTodo(todoId)).toBe(true);
        expect(TodoManager.getTodos().length).toBe(0);
    });

    test('존재하지 않는 Todo 항목을 삭제하려고 할 때 false를 반환하는지', () => {
        TodoManager.addTodo('테스트 Todo 4');
        expect(TodoManager.deleteTodo(999)).toBe(false);
        expect(TodoManager.getTodos().length).toBe(1);
    });

    test('모든 Todo 항목을 올바르게 가져오는지', () => {
        TodoManager.addTodo('Todo A');
        TodoManager.addTodo('Todo B');
        const todos = TodoManager.getTodos();
        expect(todos.length).toBe(2);
        expect(todos[0].text).toBe('Todo A');
        expect(todos[1].text).toBe('Todo B');
    });

    test('Todo 항목들이 localStorage에 올바르게 저장되는지', () => {
        TodoManager.addTodo('저장 Todo 1');
        TodoManager.addTodo('저장 Todo 2');
        const stored = localStorage.getItem('todos');
        expect(stored).not.toBeNull();
        const parsed = JSON.parse(stored);
        expect(parsed.length).toBe(2);
        expect(parsed[0].text).toBe('저장 Todo 1');
    });

    test('localStorage에서 Todo 항목들이 올바르게 로드되는지', () => {
        localStorage.setItem('todos', JSON.stringify([{ id: 1, text: '로드 Todo', completed: false }]));
        TodoManager.loadTodos();
        const todos = TodoManager.getTodos();
        expect(todos.length).toBe(1);
        expect(todos[0].text).toBe('로드 Todo');
    });

    test('localStorage에 데이터가 없을 때 빈 배열을 반환하는지', () => {
        localStorage.clear();
        TodoManager.loadTodos();
        expect(TodoManager.getTodos().length).toBe(0);
    });
});
