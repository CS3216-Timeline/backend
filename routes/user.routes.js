const express = require("express");
const router = express.Router();
const config = require("config");
const jwt = require("jsonwebtoken");
const { check, oneOf, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const { BadRequestError, UnauthorizedError } = require("../errors/errors");
const auth = require("../middleware/auth");
require("dotenv").config();
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_APP_ID);
const minPasswordLength = 5;

const UserService = require("../services/UserService");
const userService = new UserService();
const logger = require("../middleware/logger");

router.patch(
  "/profile",
  auth,
  oneOf(
    [check("name").not().isEmpty().isString(), check("picture").exists()],
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
      const { userId } = req.user;
      const { name, picture } = req.body;
      const user = await userService.updateUserDetails(
        userId,
        name,
        picture,
        null
      ); // TODO: upload picture and get url

      res.status(200).json({
        user,
      });
    } catch (err) {
      logger.logError(err);
      next(err);
    }
  }
);

router.post(
  "/changepassword",
  auth,
  [
    check("oldPassword", "Please enter your old password").exists(),
    check(
      "newPassword",
      "Please enter a password with " +
        minPasswordLength +
        " or more characters"
    )
      .exists()
      .isLength({
        min: minPasswordLength,
      }),
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
      const { oldPassword } = req.body;
      const { newPassword } = req.body;

      let password = await userService.getPassword(userId);

      if (!password) {
        throw new BadRequestError(
          "Your account was created through social login."
        );
      }

      if (!(await bcrypt.compare(oldPassword, password.password))) {
        throw new BadRequestError("Incorrect Password");
      }

      const user = await userService.updateUserDetails(
        userId,
        null,
        null,
        newPassword
      );
      res.status(200).end();
    } catch (err) {
      logger.logError(err);
      next(err);
    }
  }
);

router.delete("/delete", auth, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const user = await userService.deleteUserByUserId(userId);
    res.status(200).end();
  } catch (err) {
    logger.logError(err);
    next(err);
  }
});

module.exports = router;
