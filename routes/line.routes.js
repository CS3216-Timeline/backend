const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
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
  const userId = req.user.user_id;
  try {
    const lines = await lineService.getAllLinesByUserIdOrderByMostRecentMemory(
      userId
    );
    res.status(200).json({
      lines,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:lineId", passport.authenticate(['jwt'], { session: false }), async (req, res, next) => {
  const lineId = req.params.lineId;
  try {
    const line = await lineService.getLineByLineId(lineId);
    if (line.userId == req.user.user_id) {
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
  passport.authenticate(['jwt'], { session: false }),
  [
    //TODO: Check which fields are necessary
    check("line-name", "Line name cannot be blank").exists(),
    check("colour-hex", "Line colour cannot be blank").exists(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req)
    try {
      if (!errors.isEmpty()) {
        throw new BadRequestError(errors.array().map(err => err.msg).join(', '))
      }

      const userId = req.user.user_id;
      const name = req.body["line-name"]; // TODO: Check if there's a better way to do this
      const colourHex = req.body["colour-hex"];
      const lines = await lineService.createLine(userId, name, colourHex);

      res.status(200).json({
        lines,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
