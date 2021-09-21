const express = require("express");
const router = express.Router();
const { check, oneOf, validationResult } = require("express-validator");
const { BadRequestError, UnauthorizedError } = require("../errors/errors");
const auth = require("../middleware/auth");
const MemoryService = require("../services/MemoryService");
const memoryService = new MemoryService();

const multer = require("multer");
const LineService = require("../services/LineService");
const lineService = new LineService();
const upload = multer();

router.post(
  "/",
  auth,
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

      const { userId } = req.user;
      const { title, lineId, description, latitude, longitude } = req.body;

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
  auth,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { memoryId } = req.params;

      if (!(await checkIfMemoryExists(memoryId))) {
        throw new BadRequestError("Memory does not exist");
      }

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
  auth,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { memoryId } = req.params;

      if (!(await checkIfMemoryExists(memoryId))) {
        throw new BadRequestError("Memory does not exist");
      }

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
  auth,
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

      const { userId } = req.user;
      const { memoryId } = req.params;
      const { title, lineId, description, creationDate, latitude, longitude } = req.body;

      if (!(await checkIfMemoryExists(memoryId))) {
        throw new BadRequestError("Memory does not exist");
      }

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

async function checkIfMemoryExists(memoryId) {
  const memory = await memoryService.getMemoryByMemoryId(memoryId);
  return memory !== undefined;
}

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
