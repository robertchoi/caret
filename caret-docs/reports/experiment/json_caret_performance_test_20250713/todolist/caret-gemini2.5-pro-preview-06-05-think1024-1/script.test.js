// 가상 로컬 스토리지 설정
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

// TodoManager 클래스 (테스트 대상)
class TodoManager {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    addTodo(text) {
        if (!text || text.trim() === '') {
            return;
        }
        const newTodo = {
            id: Date.now(),
            text: text,
            completed: false
        };
        this.todos.push(newTodo);
        this.saveTodos();
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveTodos();
    }

    toggleTodo(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
        }
    }

    getTodos() {
        return this.todos;
    }
}


// 테스트 스위트
describe('TodoManager', () => {
    let todoManager;

    beforeEach(() => {
        // 각 테스트 전에 로컬 스토리지를 초기화하고 새 TodoManager 인스턴스를 생성
        localStorage.clear();
        todoManager = new TodoManager();
    });

    test('새로운 todo를 추가해야 합니다.', () => {
        todoManager.addTodo('테스트 Todo');
        const todos = todoManager.getTodos();
        expect(todos.length).toBe(1);
        expect(todos[0].text).toBe('테스트 Todo');
        expect(todos[0].completed).toBe(false);
    });

    test('빈 텍스트의 todo는 추가하지 않아야 합니다.', () => {
        todoManager.addTodo('');
        todoManager.addTodo('   ');
        const todos = todoManager.getTodos();
        expect(todos.length).toBe(0);
    });

    test('todo를 삭제해야 합니다.', () => {
        todoManager.addTodo('삭제할 Todo');
        const todoId = todoManager.getTodos()[0].id;
        todoManager.deleteTodo(todoId);
        const todos = todoManager.getTodos();
        expect(todos.length).toBe(0);
    });

    test('todo의 완료 상태를 토글해야 합니다.', () => {
        todoManager.addTodo('토글할 Todo');
        const todoId = todoManager.getTodos()[0].id;

        // 완료 상태로 토글
        todoManager.toggleTodo(todoId);
        let todos = todoManager.getTodos();
        expect(todos[0].completed).toBe(true);

        // 다시 미완료 상태로 토글
        todoManager.toggleTodo(todoId);
        todos = todoManager.getTodos();
        expect(todos[0].completed).toBe(false);
    });

    test('로컬 스토리지에 todo를 저장하고 불러와야 합니다.', () => {
        // 1. Todo 추가 및 저장 확인
        todoManager.addTodo('저장될 Todo');
        let todos = todoManager.getTodos();
        expect(JSON.parse(localStorage.getItem('todos')).length).toBe(1);
        expect(JSON.parse(localStorage.getItem('todos'))[0].text).toBe('저장될 Todo');

        // 2. 새 TodoManager 인스턴스가 데이터를 불러오는지 확인
        const newTodoManager = new TodoManager();
        const loadedTodos = newTodoManager.getTodos();
        expect(loadedTodos.length).toBe(1);
        expect(loadedTodos[0].text).toBe('저장될 Todo');
    });
});
