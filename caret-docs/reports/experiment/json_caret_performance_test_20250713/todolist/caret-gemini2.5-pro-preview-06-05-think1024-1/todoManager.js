class TodoManager {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    addTodo(text) {
        if (!text || text.trim() === '') {
            return false;
        }
        const newTodo = {
            id: Date.now(),
            text: text.trim(),
            completed: false
        };
        this.todos.push(newTodo);
        this.saveTodos();
        return true;
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
