const express = require("express");
const router = express.Router();
const { check, oneOf, validationResult } = require("express-validator");
const { BadRequestError, UnauthorizedError } = require("../errors/errors");
const auth = require("../middleware/auth");
const MemoryService = require("../services/MemoryService");
const memoryService = new MemoryService();

const multer = require("multer");

const StorageService = require("../services/StorageService");
const storageService = new StorageService();
const MediaService = require("../services/MediaService");
const mediaService = new MediaService();
const {
  checkIfMemoryExists,
  checkIfUserIsLineOwner,
  checkIfUserIsMemoryOwner,
} = require("../services/util");
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
      const { title, line, description, latitude, longitude } = req.body;

      if (!(await checkIfUserIsLineOwner(userId, line))) {
        throw new UnauthorizedError("Line does not belong to this user");
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
      console.log(memory);

      res.status(200).json({
        memory,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/:memoryId", auth, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { memoryId } = req.params;

    if (!(await checkIfMemoryExists(memoryId))) {
      throw new BadRequestError("Memory does not exist");
    }

    if (!(await checkIfUserIsMemoryOwner(userId, memoryId))) {
      throw new UnauthorizedError("Memory does not belong to this user");
    }

    const memory = await memoryService.getMemoryByMemoryId(memoryId);
    let memoryMedia = await mediaService.getAllMediaByMemory(memoryId);
    memory["media"] = memoryMedia;

    res.status(200).json({
      memory,
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/:memoryId", auth, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { memoryId } = req.params;

    if (!(await checkIfMemoryExists(memoryId))) {
      throw new BadRequestError("Memory does not exist");
    }

    if (!(await checkIfUserIsMemoryOwner(userId, memoryId))) {
      throw new UnauthorizedError("Memory does not belong to this user");
    }

    const deletedMedia = await mediaService.deleteMediaByMemory(memoryId);
    for (let i = 0; i < deletedMedia.length; i++) {
      const url = deletedMedia[i]["url"];
      await storageService.deleteImage(url);
    }

    const deletedMemory = await memoryService.deleteMemoryById(memoryId);
    deletedMemory["media"] = deletedMedia;
    res.status(200).json({
      memory: deletedMemory,
    });
  } catch (err) {
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
      const { title, line, description, creationDate, latitude, longitude } =
        req.body;

      if (!(await checkIfMemoryExists(memoryId))) {
        throw new BadRequestError("Memory does not exist");
      }

      if (!(await checkIfUserIsMemoryOwner(userId, memoryId))) {
        throw new UnauthorizedError("Memory does not belong to this user");
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
      next(err);
    }
  }
);

module.exports = router;
