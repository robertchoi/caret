const todoManager = {
  todos: [],

  addTodo(text) {
    const newTodo = {
      id: Date.now(),
      text: text,
      completed: false,
    };
    this.todos.push(newTodo);
  },

  toggleTodo(id) {
    this.todos = this.todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
  },

  deleteTodo(id) {
    this.todos = this.todos.filter(todo => todo.id !== id);
  },

  saveTodos() {
    localStorage.setItem('todos', JSON.stringify(this.todos));
  },

  loadTodos() {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      this.todos = JSON.parse(savedTodos);
    }
  },
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = todoManager;
}
