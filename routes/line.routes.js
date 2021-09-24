const express = require("express");
const router = express.Router();
const { check, oneOf, validationResult } = require("express-validator");
const {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} = require("../errors/errors");
const auth = require("../middleware/auth");
const LineService = require("../services/LineService");
const lineService = new LineService();
const MediaService = require("../services/MediaService");
const mediaService = new MediaService();
const StorageService = require("../services/StorageService");
const storageService = new StorageService();
const logger = require("../middleware/logger");

// TODO: Check whether we should return sorted or unsorted response
// Can potentially have a query parameter for them to choose
router.get("/", auth, async (req, res, next) => {
  const { userId } = req.user;
  try {
    const lines =
      await lineService.getAllLinesByUserIdWithLatestMemoryOrderByMostRecentChange(
        userId
      );
    res.status(200).json({
      lines,
    });
  } catch (err) {
    logger.logError(req, err);
    next(err);
  }
});

router.post(
  "/",
  auth,
  [
    check("lineName", "Line name cannot be blank").exists(),
    check("colorHex", "Line color must be a valid 6 digit hex")
      .exists()
      .matches(/^[a-f0-9]{6}$/),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    try {
      if (!errors.isEmpty()) {
        throw new BadRequestError(
          errors
            .array()
            .map((err) => err.msg)
            .join(", ")
        );
      }

      const { userId } = req.user;
      const { lineName } = req.body;
      const colorHex = req.body["colorHex"].toLowerCase();
      const line = await lineService.createLine(userId, lineName, colorHex);

      res.status(201).json({
        line,
      });
    } catch (err) {
      logger.logError(req, err);
      next(err);
    }
  }
);

router.get("/:lineId", auth, async (req, res, next) => {
  const { lineId } = req.params;
  const { userId } = req.user;

  try {
    let line = {};
    if (req.query.includeMemories == "true") {
      let lineWithMemories =
        await lineService.getLineByLineIdWithMemoriesOrderByCreationDate(
          userId,
          lineId
        );
      if (lineWithMemories.length === 0) {
        throw new NotFoundError("Line does not exist");
      }
      line.lineId = lineWithMemories[0].lineId;
      line.userId = lineWithMemories[0].userId;
      line.name = lineWithMemories[0].name;
      line.colorHex = lineWithMemories[0].colorHex;
      line.lastUpdatedDate = lineWithMemories[0].lastUpdatedDate;
      line.memories = [];
      for (let memory of lineWithMemories) {
        if (memory.memoryId == null) {
          break;
        }
        line.memories.push({
          memoryId: memory.memoryId,
          lineId: memory.lineId,
          title: memory.title,
          description: memory.description,
          creationDate: memory.creationDate,
          latitude: memory.latitude,
          longitude: memory.longitude,
          thumbnailUrl: memory.thumbnailUrl,
        });
      }
    } else {
      line = await lineService.getLineByLineId(userId, lineId);
      if (!line) {
        throw new NotFoundError("Line does not exist");
      }
    }

    res.status(200).json({
      line,
    });
  } catch (err) {
    logger.logError(req, err);
    next(err);
  }
});

router.patch(
  "/:lineId",
  auth,
  oneOf(
    [
      check("lineName").exists(),
      check("colorHex")
        .exists()
        .matches(/^[a-f0-9]{6}$/),
    ],
    "At least one field must be given."
  ),
  async (req, res, next) => {
    const errors = validationResult(req);
    try {
      if (!errors.isEmpty()) {
        console.error(errors);
        throw new BadRequestError(
          errors
            .array()
            .map((err) => err.msg)
            .join(", ")
        );
      }
      const { lineId } = req.params;
      const { userId } = req.user;
      const { lineName } = req.body;
      const colorHex = req.body["colorHex"]
        ? req.body["colorHex"].toLowerCase()
        : undefined;
      const line = await lineService.updateLineByLineId(
        lineId,
        userId,
        lineName,
        colorHex
      );

      if (!line) {
        throw new NotFoundError("Line does not exist");
      }

      res.status(200).json({
        line,
      });
    } catch (err) {
      logger.logError(req, err);
      next(err);
    }
  }
);

router.delete("/:lineId", auth, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { lineId } = req.params;
    const deletedMedia = await mediaService.deleteMediaByLine(userId, lineId);
    for (let i = 0; i < deletedMedia.length; i++) {
      const url = deletedMedia[i]["url"];
      await storageService.deleteImage(url);
    }
    const line = await lineService.deleteLineByLineId(lineId, userId);

    if (!line) {
      throw new NotFoundError("Line does not exist");
    }

    res.status(200).json({
      line,
    });
  } catch (err) {
    logger.logError(req, err);
    next(err);
  }
});

module.exports = router;
