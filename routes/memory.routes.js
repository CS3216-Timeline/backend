const express = require("express");
const router = express.Router();
const { check, oneOf, validationResult } = require("express-validator");
const { BadRequestError, NotFoundError } = require("../errors/errors");
const auth = require("../middleware/auth");
const MemoryService = require("../services/MemoryService");
const memoryService = new MemoryService();

const multer = require("multer");

const StorageService = require("../services/StorageService");
const storageService = new StorageService();
const MediaService = require("../services/MediaService");
const mediaService = new MediaService();
const {
  checkIfUserIsLineOwner,
  checkIfMemoryIfValidUserMemory,
  isValidDate,
} = require("../services/util");
const upload = multer();
const logger = require("../middleware/logger");

router.post(
  "/",
  auth,
  upload.array("images", parseInt(process.env.MAX_MEDIA_PER_MEMORY)),
  [
    check("title", "Title of memory cannot be blank").notEmpty(),
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
      const { title, line, description, latitude, longitude } = req.body;

      if (!(await checkIfUserIsLineOwner(userId, line))) {
        throw new NotFoundError("Line not found");
      }

      const memory = await memoryService.createMemory(
        line,
        title,
        description,
        latitude,
        longitude
      );

      const images = req.files;
      let memoryMedia = [];
      for (let i = 0; i < images.length; i++) {
        const url = await storageService.uploadImage(images[i]);
        const media = await mediaService.createMedia(
          url,
          memory["memoryId"],
          i
        );
        memoryMedia.push(media);
      }
      memory["media"] = memoryMedia;

      res.status(200).json({
        memory,
      });
    } catch (err) {
      logger.logError(req, err);
      next(err);
    }
  }
);

router.get("/:year/:month/:day", auth, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { year, month, day } = req.params;

    if (!isValidDate(year, month, day)) {
      throw new BadRequestError("Not a valid date");
    }

    let memories = await memoryService.getMemoriesByDay(
      userId,
      day,
      month,
      year
    );

    res.status(200).json({
      memories,
    });
  } catch (err) {
    logger.logError(req, err);
    next(err);
  }
});

router.get("/:year/:month", auth, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { year, month } = req.params;

    if (!isValidDate(year, month, 1)) {
      throw new BadRequestError("Not a valid date");
    }

    let numberOfMemories = await memoryService.getNumberOfMemoriesByDays(
      userId,
      month,
      year
    );

    res.status(200).json({
      numberOfMemories,
    });
  } catch (err) {
    logger.logError(req, err);
    next(err);
  }
});

router.get("/:memoryId", auth, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { memoryId } = req.params;

    if (!(await checkIfMemoryIfValidUserMemory(memoryId, userId))) {
      throw new NotFoundError("Memory not found");
    }

    const memory = await memoryService.getMemoryByMemoryId(memoryId);
    let memoryMedia = await mediaService.getAllMediaByMemory(memoryId);
    memory["media"] = memoryMedia;
    res.status(200).json({
      memory,
    });
  } catch (err) {
    logger.logError(req, err);
    next(err);
  }
});

router.delete("/:memoryId", auth, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { memoryId } = req.params;

    if (!(await checkIfMemoryIfValidUserMemory(memoryId, userId))) {
      throw new NotFoundError("Memory not found");
    }

    const deletedMedia = await mediaService.deleteMediaByMemory(memoryId);
    if (!deletedMedia) {
      throw new NotFoundError("Memory not found");
    }
    for (let i = 0; i < deletedMedia.length; i++) {
      const url = deletedMedia[i]["url"];
      await storageService.deleteImage(url);
    }

    const deletedMemory = await memoryService.deleteMemoryById(memoryId);
    if (!deletedMemory) {
      throw new NotFoundError("Memory not found");
    }
    deletedMemory["media"] = deletedMedia;
    res.status(200).json({
      memory: deletedMemory,
    });
  } catch (err) {
    logger.logError(req, err);
    next(err);
  }
});

router.patch(
  "/:memoryId",
  auth,
  [
    oneOf(
      [
        check("title", "Title of memory cannot be blank").notEmpty(),
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
      const { title, line, description, latitude, longitude } = req.body;

      if (!(await checkIfMemoryIfValidUserMemory(memoryId, userId))) {
        throw new NotFoundError("Memory not found");
      }

      const memory = await memoryService.updateMemory(
        memoryId,
        line,
        title,
        description,
        latitude,
        longitude
      );

      let memoryMedia = await mediaService.getAllMediaByMemory(memoryId);
      memory["media"] = memoryMedia;

      res.status(200).json({
        memory,
      });
    } catch (err) {
      logger.logError(req, err);
      next(err);
    }
  }
);

module.exports = router;
