// todoManager.js
// Todo 리스트 애플리케이션의 핵심 로직 (데이터 관리)

let nextId = Date.now(); // 고유 ID 생성을 위한 카운터

class TodoManager {
    constructor() {
        this.todos = this.loadTodos();
    }

    loadTodos() {
        try {
            const todosJson = localStorage.getItem('todos');
            return todosJson ? JSON.parse(todosJson) : [];
        } catch (e) {
            console.error("Error loading todos from localStorage:", e);
            return [];
        }
    }

    saveTodos() {
        try {
            localStorage.setItem('todos', JSON.stringify(this.todos));
        } catch (e) {
            console.error("Error saving todos to localStorage:", e);
        }
    }

    addTodo(content) {
        if (!content || content.trim() === '') {
            throw new Error('Todo content cannot be empty.');
        }
        const newTodo = {
            id: nextId++, // 고유 ID 생성
            content: content.trim(),
            completed: false
        };
        this.todos.push(newTodo);
        this.saveTodos();
        return newTodo;
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            return true;
        }
        return false;
    }

    deleteTodo(id) {
        const initialLength = this.todos.length;
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveTodos();
        return this.todos.length < initialLength;
    }
}

// TodoManager 클래스를 내보냅니다.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TodoManager };
}
