const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const { BadRequestError, UnauthorizedError } = require("../errors/errors");
const UserService = require("../services/UserService");
const auth = require("../middleware/auth");
const passport = require("passport");
require("dotenv").config();
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_APP_ID);
const userService = new UserService();
const minPasswordLength = 5;
const { getAuth, signInWithCustomToken } = require("firebase/auth");
const logger = require("../middleware/logger");

function generateAccessToken(userId, res) {
  jwt.sign(
    {},
    process.env.JWT_SECRET,
    {
      expiresIn: parseInt(process.env.JWT_EXPIRY_SECONDS),
      subject: userId.toString(),
    },
    (err, token) => {
      if (err) {
        throw new UnauthorizedError("user unauthorized");
      }
      res.json({
        token,
      });
    }
  );
}

router.get("/", auth, async (req, res, next) => {
  try {
    const user = await userService.findUserById(req.user.userId);
    res.json(user);
  } catch (err) {
    logger.logError(req, err);
    next(err);
  }
});

router.post(
  "/register",
  [
    check("email", "Please fill in a valid email").isEmail(),
    check("name", "Please fill in your name").not().isEmpty().isString(),
    check(
      "password",
      "Please enter a password with " +
        minPasswordLength +
        " or more characters"
    ).isLength({
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

      const { email, name, password } = req.body;

      const user = await userService.createUser(email, name, password, null);
      generateAccessToken(user.userId, res);
    } catch (err) {
      logger.logError(req, err);
      next(err);
    }
  }
);

// login route
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
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

      const { email, password } = req.body;

      // 1. Find out if user with such an email exist
      const user = await userService.findUserByEmail(email);
      if (!user) {
        throw new BadRequestError(`No user found with email ${email}`);
      }

      if (!user.password) {
        throw new BadRequestError(
          "Your account was created through social login."
        );
      }

      // 2. Find out if the password is correct
      if (!(await bcrypt.compare(password, user.password))) {
        throw new BadRequestError("Incorrect Password");
      }
      generateAccessToken(user.userId, res);
    } catch (err) {
      logger.logError(req, err);
      next(err);
    }
  }
);

router.post("/login/google", async (req, res, next) => {
  const { token } = req.body;

  try {
    if (!token) {
      throw new BadRequestError("Missing token");
    }
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_APP_ID,
    });
    const { name, email, picture } = ticket.getPayload();
    let user = await userService.findUserByEmail(email);
    if (!user) {
      user = await userService.createUser(email, name, null, null);
    }
    generateAccessToken(user.userId, res);
  } catch (err) {
    logger.logError(req, err);
    next(err);
  }
});

const facebookAuth = passport.authenticate("facebook-token", {
  session: false,
  failWithError: true,
});

const fbLogin = (req, res, next) => {
  if (req.user) {
    generateAccessToken(req.user.userId, res);
  }
};

const fbLoginError = (err, req, res, next) => {
  if (err) {
    res.status(401).json({
      error: err,
    });
  }
};

router.post("/login/facebook", facebookAuth, fbLogin, fbLoginError);

module.exports = router;
