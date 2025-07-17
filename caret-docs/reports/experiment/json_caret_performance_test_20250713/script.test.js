const TodoManager = require('./todoManager');

describe('TodoManager', () => {
  let todoManager;

  beforeEach(() => {
    localStorage.clear();
    todoManager = new TodoManager();
  });

  test('should add a new todo', () => {
    todoManager.addTodo('Test Todo');
    const todos = todoManager.getTodos();
    expect(todos).toHaveLength(1);
    expect(todos[0].text).toBe('Test Todo');
    expect(todos[0].completed).toBe(false);
  });

  test('should not add a todo if the text is empty', () => {
    todoManager.addTodo('');
    const todos = todoManager.getTodos();
    expect(todos).toHaveLength(0);
  });

  test('should toggle a todo\'s completed state', () => {
    todoManager.addTodo('Test Todo');
    let todos = todoManager.getTodos();
    todoManager.toggleTodo(todos[0].id);
    todos = todoManager.getTodos();
    expect(todos[0].completed).toBe(true);
    todoManager.toggleTodo(todos[0].id);
    todos = todoManager.getTodos();
    expect(todos[0].completed).toBe(false);
  });

  test('should delete a todo', () => {
    todoManager.addTodo('Test Todo');
    let todos = todoManager.getTodos();
    todoManager.deleteTodo(todos[0].id);
    todos = todoManager.getTodos();
    expect(todos).toHaveLength(0);
  });

  test('should save todos to local storage', () => {
    todoManager.addTodo('Test Todo');
    expect(localStorage.getItem('todos')).not.toBeNull();
    const storedTodos = JSON.parse(localStorage.getItem('todos'));
    expect(storedTodos).toHaveLength(1);
    expect(storedTodos[0].text).toBe('Test Todo');
  });

  test('should load todos from local storage', () => {
    const testTodos = [{ id: Date.now(), text: 'Stored Todo', completed: false }];
    localStorage.setItem('todos', JSON.stringify(testTodos));
    const newTodoManager = new TodoManager();
    const todos = newTodoManager.getTodos();
    expect(todos).toHaveLength(1);
    expect(todos[0].text).toBe('Stored Todo');
  });
});
