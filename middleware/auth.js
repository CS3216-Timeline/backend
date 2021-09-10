const config = require("config");
const jwt = require("jsonwebtoken");
const {
  UnauthorizedError
} = require("../errors/errors");

// set key: x-auth-token, value: token that you get from login route 
const auth = (req, res, next) => {
  // Get token from header
  const token = req.header("x-auth-token");

  // check if not token
  if (!token) {
    throw new UnauthorizedError('Unauthorized')
  }

  try {
    const {
      user
    } = jwt.verify(token, config.get("jwtSecret"));
    // get the email of the user
    req.userId = user.id;
    next();
  } catch (err) {
    throw new UnauthorizedError('Unauthorized')
  }
};

module.exports = auth;