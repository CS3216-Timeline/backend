const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const {
  BadRequestError,
  HTTPError,
  UnauthorizedError,
} = require("../errors/errors");
const auth = require("../middleware/auth");
const LineService = require("../services/LineService");
const lineService = new LineService();

// TODO: Check whether we should return sorted or unsorted response
// Can potentially have a query parameter for them to choose
router.get("/", auth, async (req, res, next) => {
  const userId = req.userId;
  console.log(userId);
  try {
    const lines = await lineService.getAllLinesByUserId(userId);
    res.status(200).json({
      lines,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:lineId", auth, async (req, res, next) => {
  // TODO: Check if user needs to be verified
  const lineId = req.params.lineId;
  try {
    const line = await lineService.getLineByLineId(lineId);
    if (line.userId == req.userId) {
      res.status(200).json({
        lines,
      });
    } else {
      next(HTTPError(UnauthorizedError));
    }
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  auth,
  [
    //TODO: Check which fields are necessary
    check("line-name", "Line name cannot be blank").exists(),
    check("color-hex", "Line color cannot be blank").exists(),
  ],
  async (req, res, next) => {
    const userId = req.userId;
    const name = req.body["line-name"]; // TODO: Check if there's a better way to do this
    const colorHex = req.body["color-hex"];
    try {
      const lines = await lineService.createLine(userId, name, colorHex);
      res.status(200).json({
        lines,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
