export default class TodoManager {
  constructor() {
    this.todos = this.loadTodos();
  }

  getTodos() {
    return this.todos;
  }

  addTodo(text) {
    const newTodo = {
      id: Date.now(),
      text: text,
      completed: false,
    };
    this.todos.push(newTodo);
    this.saveTodos();
  }

  toggleTodo(id) {
    this.todos = this.todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    this.saveTodos();
  }

  deleteTodo(id) {
    this.todos = this.todos.filter(todo => todo.id !== id);
    this.saveTodos();
  }

  loadTodos() {
    try {
      const savedTodos = localStorage.getItem('todos');
      return savedTodos ? JSON.parse(savedTodos) : [];
    } catch (e) {
      console.error('Failed to load todos from localStorage', e);
      return [];
    }
  }

  saveTodos() {
    try {
      localStorage.setItem('todos', JSON.stringify(this.todos));
    } catch (e) {
      console.error('Failed to save todos to localStorage', e);
    }
  }
}
