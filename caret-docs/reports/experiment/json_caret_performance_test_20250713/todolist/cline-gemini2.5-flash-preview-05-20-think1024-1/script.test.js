// script.test.js

const TodoList = require('./script'); // Node.js 환경에서 테스트하기 위해 모듈로 불러옴

describe('TodoList', () => {
    let todoList;

    beforeEach(() => {
        // 각 테스트 전에 localStorage를 모의(mock)하고 TodoList 인스턴스를 초기화
        localStorage.clear();
        todoList = new TodoList();
    });

    // 1. Todo 항목 추가 테스트
    test('should add a new todo item', () => {
        todoList.addTodo('Learn TDD');
        const todos = todoList.getTodos();
        expect(todos.length).toBe(1);
        expect(todos[0].content).toBe('Learn TDD');
        expect(todos[0].completed).toBe(false);
        expect(todos[0].id).toBeDefined();
    });

    // 2. 빈 내용 추가 방지 테스트
    test('should not add an empty todo item', () => {
        todoList.addTodo('');
        const todos = todoList.getTodos();
        expect(todos.length).toBe(0);
    });

    // 3. Todo 완료 상태 토글 테스트
    test('should toggle the completion status of a todo item', () => {
        todoList.addTodo('Buy groceries');
        const initialTodo = todoList.getTodos()[0];
        todoList.toggleTodo(initialTodo.id);
        const updatedTodo = todoList.getTodos()[0];
        expect(updatedTodo.completed).toBe(true);

        todoList.toggleTodo(initialTodo.id); // 다시 토글
        const toggledBackTodo = todoList.getTodos()[0];
        expect(toggledBackTodo.completed).toBe(false);
    });

    // 4. 존재하지 않는 ID 토글 시 변경 없음 테스트
    test('should not toggle if todo item with given id does not exist', () => {
        todoList.addTodo('Read a book');
        const initialTodos = todoList.getTodos();
        todoList.toggleTodo('non-existent-id');
        const currentTodos = todoList.getTodos();
        expect(currentTodos).toEqual(initialTodos); // 변경이 없어야 함
    });

    // 5. Todo 항목 삭제 테스트
    test('should delete a todo item', () => {
        todoList.addTodo('Go for a run');
        const todoToDelete = todoList.getTodos()[0];
        todoList.deleteTodo(todoToDelete.id);
        const todos = todoList.getTodos();
        expect(todos.length).toBe(0);
    });

    // 6. 존재하지 않는 ID 삭제 시 변경 없음 테스트
    test('should not delete if todo item with given id does not exist', () => {
        todoList.addTodo('Walk the dog');
        const initialTodos = todoList.getTodos();
        todoList.deleteTodo('non-existent-id');
        const currentTodos = todoList.getTodos();
        expect(currentTodos).toEqual(initialTodos); // 변경이 없어야 함
    });

    // 7. localStorage 저장 및 로드 테스트
    test('should save and load todos from localStorage', () => {
        todoList.addTodo('Write code');
        todoList.saveTodos();

        const newTodoList = new TodoList(); // 새 인스턴스 생성하여 localStorage에서 로드
        const loadedTodos = newTodoList.getTodos();
        expect(loadedTodos.length).toBe(1);
        expect(loadedTodos[0].content).toBe('Write code');
    });

    // 8. 초기 로드 시 localStorage에 데이터가 없으면 빈 배열 반환 테스트
    test('should return empty array if no data in localStorage on load', () => {
        const newTodoList = new TodoList();
        const loadedTodos = newTodoList.getTodos();
        expect(loadedTodos).toEqual([]);
    });

    // 9. 고유 ID 생성 테스트
    test('should generate unique IDs for todo items', () => {
        todoList.addTodo('Task 1');
        todoList.addTodo('Task 2');
        const todos = todoList.getTodos();
        expect(todos[0].id).not.toBe(todos[1].id);
    });
});
