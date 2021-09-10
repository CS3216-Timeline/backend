const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { BadRequestError } = require("../errors/errors");
const auth = require("../middleware/auth");
const LineService = require("../services/LineService");
const lineService = new LineService();

router.get("/", auth, async (req, res, next) => {
  const userId = req.userId; // TODO: Does this actually get userId?
  console.log("userid")
  try {
      const lines = await lineService.getAllLinesByUserId(userId)
      res.status(200).json({
      lines
    })
  } catch (err) {
    next(err);
  }
});

router.get("/:lineId", auth, async (req, res, next) => { // TODO: Check if user needs to be verified
  const lineId = req.params.lineId
  try {``
      const lines = await lineService.getLineByLineId(lineId)
      res.status(200).json({
      lines
    })
  } catch (err) {
    next(err);
  }
});

router.post("/", 
  auth,
  [
    //TODO: Check which fields are necessary 
    check("user-id", "User id cannot be blank").notEmpty(),
    check("line-name", "Line name cannot be blank").exists(),
    check("color-hex", "Line color cannot be blank").exists(),
  ],
  async (req, res, next) => { // TODO: Check if user needs to be verified
  const userId = req.body["user-id"];
  const name = req.body["line-name"];
  const colorHex = req.body["color-hex"];
  try {
      const lines = await lineService.createLine(userId, name, colorHex)
      res.status(200).json({
      lines
    })
  } catch (err) {
    next(err);
  }
});

module.exports = router;