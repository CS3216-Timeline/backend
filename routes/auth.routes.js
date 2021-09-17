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
require("dotenv").config();
const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client(process.env.GOOGLE_APP_ID)
const userService = new UserService();

function generateAccessToken(userId, res) {
  jwt.sign(
    {},
    config.get("jwtSecret"), {
      expiresIn: 360000,
      subject: userId.toString()
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

router.get("/", passport.authenticate(['jwt'], { session: false }), async (req, res, next) => {
  try {
    console.log(req.user.userId)
    const user = await userService.findUserById(req.user.userId);
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

      // 2. Find out if the password is correct
      if (!(await bcrypt.compare(password, user.password))) {
        throw new BadRequestError("Incorrect Password");
      }
      console.log(user)
      generateAccessToken(user.userId, res)
    } catch (err) {
      next(err)
    }
  }
);

router.post("/login/google", async (req, res, next) => {
  const { token } = req.body

  try {
    const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_APP_ID
    });
    const { name, email } = ticket.getPayload();    // TODO: we can also include 'picture' in the future
    let user = await userService.findUserByEmail(email);
    if (!user) {
      user = await userService.createUser(email, name, null);
    }
    console.log(user);
    generateAccessToken(user.userId, res);
  } catch (err) {
    console.log(err)
    next(err)
  }
});

const facebookAuth = passport.authenticate("facebook-token", {
  session: false,
  failWithError: true,
});

const fbLogin = (req, res, next) => {
  if (req.user) {
    console.log("Successful login via Facebook.");
    console.log(req.authInfo)
    console.log("_____________________")
    console.log(req.user.userId)
    generateAccessToken(req.user.userId, res);
    // generateAccessToken(req.authInfo.userId, res);
  }
};

const fbLoginError = (err, req, res, next) => {
  if (err) {
    console.log("Error logging in via Facebook.");
    res.status(401).json({
      error: err,
    });
  }
};

router.post("/login/facebook",facebookAuth, fbLogin, fbLoginError);

module.exports = router;
