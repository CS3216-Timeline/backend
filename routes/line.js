const express = require("express");
const router = express.Router();
const {
  check,
  validationResult
} = require("express-validator");
const {
  BadRequestError
} = require("../errors/errors");
const auth = require("../middleware/auth");
const LineService = require("../services/LineService");
const lineService = new LineService();

router.get("/", auth, async (req, res, next) => {
  const userId = req.userId;
  try {
      const lines = await lineService.getAllLinesByUserId(userId)
      res.status(200).json({
      lines
    })
  } catch (err) {
    next(err);
  }
});

module.exports = router;