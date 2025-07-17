import TodoManager from './todoManager';

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

  test('should toggle a todo', () => {
    todoManager.addTodo('Test Todo');
    let todos = todoManager.getTodos();
    const todoId = todos[0].id;

    todoManager.toggleTodo(todoId);
    todos = todoManager.getTodos();
    expect(todos[0].completed).toBe(true);

    todoManager.toggleTodo(todoId);
    todos = todoManager.getTodos();
    expect(todos[0].completed).toBe(false);
  });

  test('should delete a todo', () => {
    todoManager.addTodo('Test Todo');
    let todos = todoManager.getTodos();
    const todoId = todos[0].id;

    todoManager.deleteTodo(todoId);
    todos = todoManager.getTodos();
    expect(todos).toHaveLength(0);
  });

  test('should save and load todos from localStorage', () => {
    todoManager.addTodo('Todo 1');
    todoManager.addTodo('Todo 2');
    
    const newTodoManager = new TodoManager();
    const loadedTodos = newTodoManager.getTodos();
    
    expect(loadedTodos).toHaveLength(2);
    expect(loadedTodos[0].text).toBe('Todo 1');
    expect(loadedTodos[1].text).toBe('Todo 2');
  });
});
