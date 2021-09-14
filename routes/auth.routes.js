const express = require("express");
const router = express.Router();
const config = require("config");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const { BadRequestError, UnauthorizedError } = require("../errors/errors");
const UserService = require("../services/UserService");
const auth = require("../middleware/auth");
const passport = require('passport');
const userService = new UserService();

function generateAccessToken(userId, res) {
  jwt.sign(
    {},
    config.get("jwtSecret"), {
      expiresIn: 360000,
      subject: user_id.toString()
    },
    (err, token) => {
      if (err) {
        throw new UnauthorizedError('user unauthorized');
      }
      res.json({
        token
      });
    }
  );
}

function generateUserToken(req, res) {
  generateAccessToken(req.user.user_id, res);
}

router.get("/", passport.authenticate(['jwt'], { session: false }), async (req, res, next) => {
  try {
    const user = await userService.findUserById(req.userId);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// login route
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Please is required").exists(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError(
        errors
          .array()
          .map((err) => err.msg)
          .join(", ")
      );
    }
    const { email, password } = req.body;
    try {
      // 1. Find out if user with such an email exist
      const user = await userService.findUserByEmail(email);
      if (!user) {
        throw new BadRequestError(`No user found with email ${email}`);
      }

      // 2. Find out if the password is correct
      if (!(await bcrypt.compare(password, user.password))) {
        throw new BadRequestError("Incorrect Password");
      }

      generateAccessToken(user.user_Id, res)
    } catch (err) {
      next(err)
    }
  }
);

app.get('/login/google/start',
  passport.authenticate('google', { session: false, scope: ['openid', 'profile', 'email'] }));
app.get('/login/google/redirect',
  passport.authenticate('google', { session: false }),
  generateUserToken);

module.exports = router;
