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
    console.log("Request Error: No token")
    throw new UnauthorizedError('Unauthorized')
  }

  try {
    const {
      sub
    } = jwt.verify(token, config.get("jwtSecret"));
    // get the id of the user
    req.userId = sub;
    next();
  } catch (err) {
    console.log("Request Error: Token is invalid")
    throw new UnauthorizedError('Unauthorized')
  }
};

module.exports = auth;