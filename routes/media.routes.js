const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { BadRequestError, NotFoundError } = require("../errors/errors");
const auth = require("../middleware/auth");
const logger = require("../logs/logger");

const multer = require("multer");
const {
  checkIfMemoryIsValidUserMemory,
  checkIfMediaIsValidUserMedia,
} = require("../services/util");
const StorageService = require("../services/StorageService");
const storageService = new StorageService();
const MediaService = require("../services/MediaService");
const mediaService = new MediaService();
const upload = multer();

router.post(
  "/",
  auth,
  upload.array("images", parseInt(process.env.MAX_MEDIA_PER_MEMORY)),
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

      if (!(await checkIfMemoryIsValidUserMemory(memoryId, userId))) {
        throw new NotFoundError("Memory does not exist");
      }

      let curMedia = await mediaService.getAllMediaByMemory(memoryId);
      const images = req.files;
      const initialLength = curMedia.length;
      const addedLength = images.length;

      if (
        initialLength + addedLength >
        parseInt(process.env.MAX_MEDIA_PER_MEMORY)
      ) {
        throw new BadRequestError(
          "Exceeded maximum number of media for this memory"
        );
      }

      for (let i = 0; i < addedLength; i++) {
        const url = await storageService.uploadImage(images[i]);
        const newMedia = await mediaService.createMedia(
          url,
          memoryId,
          initialLength + i
        );
        curMedia.push(newMedia);
      }

      res.status(200).json({
        media: curMedia,
      });
    } catch (err) {
      logger.logError(req, err);
      next(err);
    }
  }
);

router.get("/:mediaId", auth, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { mediaId } = req.params;

    if (!(await checkIfMediaIsValidUserMedia(mediaId, userId))) {
      throw new NotFoundError("Media does not exist");
    }

    const media = await mediaService.getMediaByMediaId(mediaId);

    res.status(200).json({
      media,
    });
  } catch (err) {
    logger.logError(req, err);
    next(err);
  }
});

router.delete("/:mediaId", auth, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { mediaId } = req.params;

    if (!(await checkIfMediaIsValidUserMedia(mediaId, userId))) {
      throw new NotFoundError("Media does not exist");
    }

    const deletedMedia = await mediaService.deleteMediaById(mediaId);
    if (!deletedMedia) {
      throw new NotFoundError("Memory does not exist");
    }
    const memoryId = deletedMedia["memoryId"];
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
    logger.logError(req, err);
    next(err);
  }
});

router.post(
  "/positions",
  auth,
  [
    check("updates", "At least one position needs to be updated").isArray({
      min: 1,
    }),
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
      const { memoryId, updates } = req.body;

      if (!(await checkIfMemoryIsValidUserMemory(memoryId, userId))) {
        throw new NotFoundError("Memory does not exist");
      }

      await mediaService.updatePositions(updates);

      res.status(200).json({
        memoryId: memoryId,
        updates: updates,
      });
    } catch (err) {
      logger.logError(req, err);
      next(err);
    }
  }
);

module.exports = router;
