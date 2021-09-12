const express = require("express");
const router = express.Router();
const config = require('config');
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const { BadRequestError } = require("../errors/errors");

const UserService = require('../services/UserService');
const userService = new UserService();

router.post(
  "/register",
  [
    check("email", "Please fill in a valid email").isEmail(),
    check("name", "Please fill in your name").not().isEmpty().isString(),
    check(
      "password",
      "Please enter a password with t or more characters"
    ).isLength({
      min: 5
    }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new BadRequestError(errors.array().map(err => err.msg).join(', '))
    }
    const {
      email,
      name,
      password
    } = req.body;
    try {
      const user = await userService.createUser(email, name, password)

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
  }
)

module.exports = router;