const bcrypt = require('bcryptjs');
const pool = require('../db/db');
const camelizeKeys = require('../db/utils');
const {
  BadRequestError
} = require('../errors/errors');

class UserService {
  constructor() { }
  async createUser(email, name, password, pictureUrl) {
    // first check if user exist
    try {
      const user = await pool.query("SELECT * FROM users WHERE email = $1", [
        email
      ]);
      if (user.rows[0]) {
        throw new BadRequestError('Email already used, please login')
      }
      let newUser = null;
      const hashedPassword = null;
      if (password != null) {
        // hash the password 
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(password, salt);
      }
      newUser = await pool.query(
        "INSERT INTO users (email, name, password, picture_url) VALUES($1, $2, $3, $4) RETURNING *",
        [email, name, hashedPassword, pictureUrl]
      );
      return camelizeKeys(newUser.rows[0]);
    } catch (err) {
      throw err;
    }
  }

  async findUserByEmail(email) {
    try {
      const user = await pool.query("SELECT * FROM users WHERE email = $1", [
        email
      ]);
      return camelizeKeys(user.rows[0]);
    } catch (err) {
      throw err;
    }
  }

  async findUserById(userId) {
    try {
      const user = await pool.query("SELECT user_id, email, name FROM users WHERE user_id = $1", [
        userId
      ]);
      return camelizeKeys(user.rows[0]);
    } catch (err) {
      throw err;
    }
  }

  async getPassword(userId) {
      try {
      const password = await pool.query("SELECT password FROM users WHERE user_id = $1", [
        userId
      ]);
      return camelizeKeys(password.rows[0]);
    } catch (err) {
      throw err;
    }
  }

  
  async updateUserDetails(userId, name, pictureUrl, password) {
    let hashedPassword = null
    if (password != null) {
      // hash the password 
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    try {
      const updatedUser = await pool.query(`
      UPDATE users SET name = COALESCE($1, name), picture_url = COALESCE($2, picture_url), password = COALESCE($3, password)
      WHERE user_id = $4 RETURNING user_id, email, name
      `, [name, pictureUrl, hashedPassword, userId]);
      if (!updatedUser.rows[0]) {
        throw new NotFoundError('User does not exist');
      }
      
      return camelizeKeys(updatedUser.rows[0]);
    } catch (err) {
      throw err;
    }
  }

  async deleteUserByUserId(userId) {
    try {
      const deletedUser = await pool.query("DELETE FROM users WHERE user_id = $1 RETURNING *", [
        userId
      ]);
      if (!deletedUser.rows[0]) {
        throw new NotFoundError('User does not exist');
      }
      return camelizeKeys(deletedUser.rows[0]);
    } catch (err) {
      throw err;
    }
  }
}

module.exports = UserService