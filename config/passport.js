const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const FacebookTokenStrategy = require("passport-facebook-token");
const config = require('config');
const UserService = require('../services/UserService');
require('dotenv').config()

const userService = new UserService();

const jwtOptions = {
  secretOrKey: config.get("jwtSecret"),
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), 
};

const jwtVerify = async (payload, done) => {
  try {
    const user = await userService.findUserById(parseInt(payload.sub));
    if (!user) {
      console.log('Request: User not found.');
      return done(null, false);
    }
    console.log('Request: User verified.');
    done(null, user);
  } catch (error) {
    console.log('Request: Verification error.');
    done(error);
  }
};

const facebookOptions = {
  clientID: process.env.FB_APP_ID,
  clientSecret: process.env.FB_APP_SECRET,
}

const facebookVerify = (accessToken, refreshToken, profile, next) => {
  try {
    let email = profile.emails[0].value;
    let user = userService.findUserByEmail(email);
    if (!user) {
      user = userService.createUser(email, profile.displayName, null);
    }
    return next(null, user);
  } catch (error) {
    next(error, false);
  }
};


const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);
const facebookStrategy = new FacebookTokenStrategy(facebookOptions, facebookVerify)
module.exports.jwtStrategy = jwtStrategy;
module.exports.facebookStrategy = facebookStrategy;
