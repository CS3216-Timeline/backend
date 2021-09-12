const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { BadRequestError } = require("../errors/errors");
const auth = require("../middleware/auth");
const MemoryService = require("../services/MemoryService");
const memoryService = new MemoryService();

// Create a memory
router.post('/',
  auth,
  [
    //TODO: Check which fields are necessary 
    check("title", "Title of memory cannot be blank").notEmpty(),
    check("description", "Description cannot be blank").exists(),
    check("media", "Media cannot be blank").exists(),
    check("line", "Line cannot be blank").exists(),
    check("latitude", "Latitude cannot be blank").exists(),
    check("longitude", "Longitude cannot be blank").exists()
  ],
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new BadRequestError(errors.array().map(err => err.msg).join(', '))
    }

    const userId = req.userId;
    const { title } = req.body;

    try {
      const memory = await memoryService.createMemory(userId, title);
      res.status(200).json({ 
        memory
      })
    } catch (err) {
      next(err);
    }
  }
);

// TODO: Verify if correct user.
router.get("/:memoryId", auth, async (req, res, next) => {
  const memoryId = req.params.memoryId;
  try {
    const memories = await memoryService.getMemoryByMemoryId(memoryId);
    res.status(200).json({
      memories
    })
  } catch (err) {
    next(err);
  }
});

router.delete("/:memoryId", auth, async (req, res, next) => {
  const memoryId = req.params.memoryId;
  try {
    const deletedMemory = await memoryService.deleteOneById(memoryId);
    res.status(200).json({
      memory: deletedMemory
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;