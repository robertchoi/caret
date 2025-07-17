class TodoManager {
  constructor() {
    this.todos = JSON.parse(localStorage.getItem('todos')) || [];
  }

  getTodos() {
    return this.todos;
  }

  addTodo(text) {
    if (!text) {
      return;
    }

    const newTodo = {
      id: Date.now(),
      text: text,
      completed: false,
    };

    this.todos.push(newTodo);
    this._saveToLocalStorage();
  }

  toggleTodo(id) {
    this.todos = this.todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    this._saveToLocalStorage();
  }

  deleteTodo(id) {
    this.todos = this.todos.filter(todo => todo.id !== id);
    this._saveToLocalStorage();
  }

  _saveToLocalStorage() {
    localStorage.setItem('todos', JSON.stringify(this.todos));
  }
}

module.exports = TodoManager;
