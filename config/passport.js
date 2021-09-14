const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const passportGoogle = require('passport-google-oauth');
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

const googleOptions = {
  clientID: process.env.GOOGLE_APP_ID,
  clientSecret: process.env.GOOGLE_APP_SECRET,
  callbackURL: 'http://localhost:5000/api/login/google/redirect' //TODO: Abstract out base url
};

const googleVerify = function (request, accessToken, refreshToken, profile, done) {
    let email = profile.emails[0].value
    // See if this user already exists
    let user = userService.findUserByEmail(email);
    if (!user) {
      // They don't, so register them
      user = userService.createUser(email, profile.displayName, null);
    }
    return done(null, user);
  }

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);
const googleStrategy = new passportGoogle.OAuth2Strategy(googleOptions, googleVerify)

module.exports.jwtStrategy = jwtStrategy;
module.exports.googleStrategy = googleStrategy;

