const express = require("express");
const router = express.Router();
const { check, oneOf, validationResult } = require("express-validator");
const { BadRequestError, UnauthorizedError } = require("../errors/errors");
const passport = require("passport");
const MemoryService = require("../services/MemoryService");
const memoryService = new MemoryService();

const multer = require("multer");
const LineService = require("../services/LineService");
const lineService = new LineService();
const upload = multer();

router.post(
  "/",
  passport.authenticate(["jwt"], { session: false }),
  upload.array("images", 10),
  [
    //TODO: Check which fields are necessary
    check("title", "Title of memory cannot be blank").notEmpty(),
    check("description", "Description cannot be blank").exists(),
    check("line", "Line cannot be blank").exists(),
    check("latitude", "Latitude cannot be blank").exists(),
    check("longitude", "Longitude cannot be blank").exists(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError(
          errors
            .array()
            .map((err) => err.msg)
            .join(", ")
        );
      }

      const userId = req.user.userId;
      const title = req.body["title"];
      const lineId = req.body["line"];
      const description = req.body["description"];
      const latitude = req.body["latitude"];
      const longitude = req.body["longitude"];

      if (!(await checkIfUserIsLineOwner(userId, lineId))) {
        throw new UnauthorizedError("Line does not belong to this user");
      }

      const memory = await memoryService.createMemory(
        lineId,
        title,
        description,
        latitude,
        longitude
      );

      res.status(200).json({
        memory,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:memoryId",
  passport.authenticate(["jwt"], { session: false }),
  async (req, res, next) => {
    try {
      const memoryId = req.params.memoryId;
      const userId = req.user.userId;

      if (!(await checkIfUserIsMemoryOwner(userId, memoryId))) {
        throw new UnauthorizedError("Memory does not belong to this user");
      }

      const memories = await memoryService.getMemoryByMemoryId(memoryId);
      res.status(200).json({
        memories,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/:memoryId",
  passport.authenticate(["jwt"], { session: false }),
  async (req, res, next) => {
    try {
      const memoryId = req.params.memoryId;
      const userId = req.user.userId;

      if (!(await checkIfUserIsMemoryOwner(userId, memoryId))) {
        throw new UnauthorizedError("Memory does not belong to this user");
      }

      const deletedMemory = await memoryService.deleteOneById(memoryId);
      res.status(200).json({
        memory: deletedMemory,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:memoryId",
  passport.authenticate(["jwt"], { session: false }),
  [
    oneOf(
      [
        check("title", "Title of memory cannot be blank").notEmpty(),
        check("description", "Description cannot be blank").notEmpty(),
        check("line", "Line cannot be blank").notEmpty(),
        check("latitude", "Latitude cannot be blank").notEmpty(),
        check("longitude", "Longitude cannot be blank").notEmpty(),
      ],
      "At least one field must be present"
    ),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError(
          errors
            .array()
            .map((err) => err.msg)
            .join(", ")
        );
      }

      const userId = req.user.userId;
      const memoryId = req.params.memoryId;
      const title = req.body["title"];
      const lineId = req.body["line"];
      const description = req.body["description"];
      const creationDate = req.body["creationDate"];
      const latitude = req.body["latitude"];
      const longitude = req.body["longitude"];

      if (!(await checkIfUserIsMemoryOwner(userId, memoryId))) {
        throw new UnauthorizedError("Memory does not belong to this user");
      }

      const memory = await memoryService.updateMemory(
        memoryId,
        lineId,
        title,
        description,
        creationDate,
        latitude,
        longitude
      );

      res.status(200).json({
        memory,
      });
    } catch (err) {
      next(err);
    }
  }
);

async function checkIfUserIsLineOwner(userId, lineId) {
  const line = await lineService.getLineByLineId(lineId);
  return line["userId"] === userId;
}

async function checkIfUserIsMemoryOwner(userId, memoryId) {
  const memory = await memoryService.getMemoryByMemoryId(memoryId);
  const userLines = await lineService.getAllLinesByUserId(userId);
  memoryLineId = memory["lineId"];

  for (var i = 0; i < userLines.length; i += 1) {
    line = userLines[i];
    if (memoryLineId === line["lineId"]) {
      return true;
    }
  }

  return false;
}

module.exports = router;
