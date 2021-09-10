const pool = require('../db/db');
const {
  NotFoundError
} = require('../errors/errors');

class TodoService {
  constructor() {}

  async createOne(userId, title) {
    try {
      const newTodo = await pool.query(
        "INSERT INTO todos (todo_owner, title) VALUES($1, $2) RETURNING *",
        [userId, title]
      );
      return newTodo.rows[0];
    } catch (err) {
      throw err;
    }
  }

  async getAllTodosByUserId(userId) {
    try {
      const todos = await pool.query(
        "SELECT * FROM todos WHERE todo_owner = $1",
        [userId]
      );
      return todos.rows;
    } catch (err) {
      throw err;
    }
  }

  async deleteOneById(todoId) {
    try {
      const deletedTodo = await pool.query("DELETE FROM todos WHERE todo_id = $1 RETURNING *", [
        todoId
      ]);
      if (!deletedTodo.rows[0]) {
        throw NotFoundError('Todo does not exist, cannot delete');
      }
      return deletedTodo.rows[0];
    } catch (err) {
      throw err;
    }
  }
}

module.exports = TodoService