const bcrypt = require('bcryptjs');
const pool = require('../db/db');
const {
  BadRequestError
} = require('../errors/errors');

class UserService {
  constructor() { }
  async createUser(email, name, password) {
    // first check if user exist
    try {
      const user = await pool.query("SELECT * FROM users WHERE email = $1", [
        email
      ]);
      if (user.rows[0]) {
        throw new BadRequestError('Email already used, please login')
      }
      // hash the password 
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await pool.query(
        "INSERT INTO users (email, name, password) VALUES($1, $2, $3) RETURNING *",
        [email, name, hashedPassword]
      );
      return newUser.rows[0];
    } catch (err) {
      throw err;
    }
  }

  async findUserByEmail(email) {
    try {
      const user = await pool.query("SELECT * FROM users WHERE email = $1", [
        email
      ]);
      return user.rows[0];
    } catch (err) {
      throw err;
    }
  }

  async findUserById(userId) {
    try {
      const user = await pool.query("SELECT user_id, email, name FROM users WHERE user_id = $1", [
        userId
      ]);
      return user.rows[0];
    } catch (err) {
      throw err;
    }
  }
}

module.exports = UserService