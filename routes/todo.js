const express = require("express");
const router = express.Router();
const {
  check,
  validationResult
} = require("express-validator");
const { NIL } = require("uuid");
const {
  BadRequestError
} = require("../errors/errors");
const auth = require("../middleware/auth");
const TodoService = require("../services/TodoService");

const todoService = new TodoService();

// create a todo
router.post('/',
  auth,
  [
    check("title", "Title of todo cannot be blank").notEmpty(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new BadRequestError(errors.array().map(err => err.msg).join(', '))
    }
    const userId = req.userId;
    const {
      title
    } = req.body;
    try {
      const todo = await todoService.createOne(userId, title);
      res.status(200).json({
        todo
      })
    } catch (err) {
      next(err);
    }
  });

router.get("/", auth, async (req, res, next) => {
  const userId = req.userId;
  try {
    const todos = await todoService.getAllTodosByUserId(userId);
    res.status(200).json({
      todos
    })
  } catch (err) {
    next(err);
  }
});

// route to delete a todo by id
router.delete("/:todoId", auth, async (req, res, next) => {
  const todoId = req.params.todoId;
  try {
    const deletedTodo = await todoService.deleteOneById(todoId);
    res.status(200).json({
      todo: deletedTodo
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;