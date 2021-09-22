const express = require("express");
const router = express.Router();
const { check, oneOf, validationResult } = require("express-validator");
const { BadRequestError, UnauthorizedError } = require("../errors/errors");
const auth = require("../middleware/auth");
const MemoryService = require("../services/MemoryService");
const memoryService = new MemoryService();
const logger = require("../middleware/logger");

const multer = require("multer");
const {
  checkIfMemoryExists,
  checkIfMediaExists,
  checkIfUserIsMediaOwner,
  checkIfUserIsMemoryOwner,
} = require("../services/util");
const StorageService = require("../services/StorageService");
const storageService = new StorageService();
const MediaService = require("../services/MediaService");
const mediaService = new MediaService();
const upload = multer();

router.post(
  "/",
  auth,
  upload.array("images", 10),
  [check("memoryId", "Memory Id cannot be blank").notEmpty()],
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
      const { memoryId } = req.body;

      if (!(await checkIfUserIsMemoryOwner(userId, memoryId))) {
        throw new UnauthorizedError("Memory does not belong to this user");
      }

      let curMedia = await mediaService.getAllMediaByMemory(memoryId);
      const offset = curMedia.length;
      const images = req.files;
      for (let i = 0; i < images.length; i++) {
        const url = await storageService.uploadImage(images[i]);
        const newMedia = await mediaService.createMedia(
          url,
          memoryId,
          offset + i
        );
        curMedia.push(newMedia);
      }

      res.status(200).json({
        media: curMedia,
      });
    } catch (err) {
      logger.logError(err);
      next(err);
    }
  }
);

router.get("/:mediaId", auth, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { mediaId } = req.params;

    if (!(await checkIfMediaExists(mediaId))) {
      throw new BadRequestError("Media does not exist");
    }

    if (!(await checkIfUserIsMediaOwner(userId, mediaId))) {
      throw new UnauthorizedError("Media does not belong to this user");
    }

    const media = await mediaService.getMediaByMediaId(mediaId);

    res.status(200).json({
      media,
    });
  } catch (err) {
    logger.logError(err);
    next(err);
  }
});

router.delete("/:mediaId", auth, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { mediaId } = req.params;
    const { memoryId } = req.body;

    if (!(await checkIfMediaExists(mediaId))) {
      throw new BadRequestError("Media does not exist");
    }

    if (!(await checkIfUserIsMediaOwner(userId, mediaId))) {
      throw new UnauthorizedError("Media does not belong to this user");
    }

    const deletedMedia = await mediaService.deleteMediaById(mediaId);
    const remainingMedia = await mediaService.getAllMediaByMemory(memoryId);
    let updates = [];
    const deletedPos = parseInt(deletedMedia["position"]);

    for (let i = 0; i < remainingMedia.length; i++) {
      pos = parseInt(remainingMedia[i]["position"]);
      if (pos > deletedPos) {
        pos -= 1;
        update = {
          mediaId: remainingMedia[i]["mediaId"],
          position: pos.toString(),
        };
        updates.push(update);
      }
    }

    await mediaService.updatePositions(updates);

    res.status(200).json({
      media: deletedMedia,
    });
  } catch (err) {
    logger.logError(err);
    next(err);
  }
});

router.post(
  "/positions",
  auth,
  [check("updates", "At least one position needs to be updated").notEmpty()],
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
      const { memoryId, updates } = req.body;

      if (!(await checkIfMemoryExists(memoryId))) {
        throw new BadRequestError("Memory does not exist");
      }

      if (!(await checkIfUserIsMemoryOwner(userId, memoryId))) {
        throw new UnauthorizedError("Memory does not belong to this user");
      }

      await mediaService.updatePositions(updates);

      res.status(200).json({
        memoryId: memoryId,
        updates: updates,
      });
    } catch (err) {
      logger.logError(err);
      next(err);
    }
  }
);

module.exports = router;
