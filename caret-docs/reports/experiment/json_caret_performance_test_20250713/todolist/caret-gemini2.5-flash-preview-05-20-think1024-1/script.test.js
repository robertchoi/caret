// script.test.js
const { addTodo, getTodos, toggleTodo, deleteTodo } = require('./script');

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('Todo 관리 모듈', () => {
    beforeEach(() => {
        localStorage.clear(); // 각 테스트 전에 localStorage 초기화
    });

    test('addTodo: 새로운 Todo 항목을 추가하고 localStorage에 저장해야 한다', () => {
        addTodo('테스트 Todo 1');
        const todos = getTodos();
        expect(todos.length).toBe(1);
        expect(todos[0].content).toBe('테스트 Todo 1');
        expect(todos[0].completed).toBe(false);
        expect(todos[0].id).toBeDefined();
        expect(JSON.parse(localStorage.getItem('todos')).length).toBe(1);
    });

    test('addTodo: 빈 문자열은 추가되지 않아야 한다', () => {
        addTodo('');
        const todos = getTodos();
        expect(todos.length).toBe(0);
        expect(localStorage.getItem('todos')).toBeNull();
    });

    test('getTodos: localStorage에서 모든 Todo 항목을 불러와야 한다', () => {
        localStorage.setItem('todos', JSON.stringify([{ id: 1, content: '저장된 Todo', completed: false }]));
        const todos = getTodos();
        expect(todos.length).toBe(1);
        expect(todos[0].content).toBe('저장된 Todo');
    });

    test('getTodos: 저장된 데이터가 없을 경우 빈 배열을 반환해야 한다', () => {
        const todos = getTodos();
        expect(todos).toEqual([]);
    });

    test('toggleTodo: 특정 ID의 Todo 항목의 완료 상태를 토글해야 한다', () => {
        addTodo('토글할 Todo');
        let todos = getTodos();
        const todoId = todos[0].id;

        toggleTodo(todoId);
        todos = getTodos();
        expect(todos[0].completed).toBe(true);

        toggleTodo(todoId);
        todos = getTodos();
        expect(todos[0].completed).toBe(false);
        expect(JSON.parse(localStorage.getItem('todos'))[0].completed).toBe(false);
    });

    test('toggleTodo: 존재하지 않는 ID에 대한 호출은 아무런 영향을 미치지 않아야 한다', () => {
        addTodo('기존 Todo');
        const initialTodos = getTodos();
        toggleTodo('non-existent-id');
        const currentTodos = getTodos();
        expect(currentTodos).toEqual(initialTodos);
    });

    test('deleteTodo: 특정 ID의 Todo 항목을 삭제해야 한다', () => {
        addTodo('삭제할 Todo');
        let todos = getTodos();
        const todoId = todos[0].id;

        deleteTodo(todoId);
        todos = getTodos();
        expect(todos.length).toBe(0);
        expect(localStorage.getItem('todos')).toBe('[]');
    });

    test('deleteTodo: 존재하지 않는 ID에 대한 호출은 아무런 영향을 미치지 않아야 한다', () => {
        addTodo('기존 Todo');
        const initialTodos = getTodos();
        deleteTodo('non-existent-id');
        const currentTodos = getTodos();
        expect(currentTodos).toEqual(initialTodos);
    });
});
