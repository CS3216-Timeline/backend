const express = require("express");
const router = express.Router();
const { check,oneOf, validationResult } = require("express-validator");
const {
  BadRequestError,
  HTTPError,
  UnauthorizedError,
} = require("../errors/errors");

// Auth: remove one
const auth = require("../middleware/auth");
const passport = require('passport');

const LineService = require("../services/LineService");
const lineService = new LineService();

// TODO: Check whether we should return sorted or unsorted response
// Can potentially have a query parameter for them to choose
router.get("/", passport.authenticate(['jwt'], { session: false }), async (req, res, next) => {
  const userId = req.user.userId;
  try {
    const lines = await lineService.getAllLinesByUserIdOrderByMostRecentChange(
      userId
    );
    res.status(200).json({
      lines,
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  passport.authenticate(['jwt'], { session: false }),
  [
    check("lineName", "Line name cannot be blank").exists(),
    check("colorHex", "Line color cannot be blank").exists(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req)
    try {
      if (!errors.isEmpty()) {
        throw new BadRequestError(errors.array().map(err => err.msg).join(', '))
      }

      const userId = req.user.userId;
      const name = req.body["lineName"]; // TODO: Check if there's a better way to do this
      const colorHex = req.body["colorHex"].toLowerCase();
      const line = await lineService.createLine(userId, name, colorHex);

      res.status(201).json({
        line,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/:lineId", passport.authenticate(['jwt'], { session: false }), async (req, res, next) => {
  const lineId = req.params.lineId;
  try {
    const line = await lineService.getLineByLineId(lineId);
    if (line["userId"] == req.user.userId) {
      res.status(200).json({
        line,
      });
    } else {
      console.error("unauthorized")
      throw new UnauthorizedError("You do not have access to this line");
    }
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/:lineId",
  passport.authenticate(['jwt'], { session: false }),
  oneOf([
    check("lineName").exists(),
    check("colorHex").exists(),
  ],"At least one field must be given."),
  async (req, res, next) => {
    const errors = validationResult(req)
    try {
      if (!errors.isEmpty()) {
        console.error(errors);
        throw new BadRequestError(errors.array().map(err => err.msg).join(', '))
      }
      const lineId = req.params.lineId;
      const userId = req.user.userId;
      const name = req.body["lineName"]; // TODO: Check if there's a better way to do this
      const colorHex = req.body["colorHex"].toLowerCase();
      const line = await lineService.updateLineByLineId(lineId, userId, name, colorHex);

      res.status(200).json({
        line,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/:lineId", passport.authenticate(['jwt'], { session: false }), async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const lineId = req.params.lineId;
    const line = await lineService.deleteLineByLineId(lineId, userId);

    res.status(200).json({
      line,
    });
  } catch (err) {
    next(err);
  }
});


module.exports = router;
