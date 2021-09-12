const express = require("express");
const router = express.Router();
const config = require('config');
const jwt = require("jsonwebtoken");
const {
  check,
  validationResult
} = require("express-validator");
const bcrypt = require("bcryptjs");
const {
  BadRequestError,
  UnauthorizedError
} = require("../errors/errors");
const UserService = require("../services/UserService");
const auth = require('../middleware/auth');
const userService = new UserService();

// login route
router.post("/login", [
  check("email", "Please include a valid email").isEmail(),
  check("password", "Please is required").exists(),
], async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new BadRequestError(errors.array().map(err => err.msg).join(', '))
  }
  const {
    email,
    password
  } = req.body;
  try {

    // 1. Find out if user with such an email exist
    const user = await userService.findUserByEmail(email);
    if (!user) {
      throw new BadRequestError(`No user found with email ${email}`);
    }

    // 2. Find out if the password is correct
    if (!await bcrypt.compare(password, user.password)) {
      throw new BadRequestError('Incorrect Password');
    }

    const payload = {
      user: {
        id: user.user_id,
      },
    };

    // returns a token
    jwt.sign(
      payload,
      config.get("jwtSecret"), {
        expiresIn: 360000
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
  } catch (err) {
    next(err)
  }
});

module.exports = router;