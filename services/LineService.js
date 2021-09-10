const pool = require('../db/db');
const {
  NotFoundError
} = require('../errors/errors');

class LineService {
  constructor() { }

  async createLine(userId, name, colourHex) {
    try {
      const newLine = await pool.query(
        "INSERT INTO lines (user_id, name, colour_hex) VALUES ($1, $2, $3) RETURNING *",
        [userId, name, colourHex]
      );
      return newLine.rows[0];
    } catch (err) {
      throw err;
    }
  }

  async getLineByLineId(lineId) {
    try {
      const lines = await pool.query(
        "SELECT * FROM lines WHERE line_id = $1",
        [lineId]
      );
      return lines.rows[0];
    } catch (err) {
      throw err;
    }
  }

  async getAllLinesByUserId(userId) {
    try {
      const lines = await pool.query(
        "SELECT * FROM lines WHERE user_id = $1",
        [userId]
      );
      return lines.rows;
    } catch (err) {
      throw err;
    }
  }

  async getAllLinesByUserIdOrderByMostRecentMemory(userId) {
    try {
      const lines = await pool.query(
        "SELECT line_id, user_id, name, colour_hex, (SELECT MAX(creation_date) FROM memories WHERE line_id = L.line_id) AS last_memory_date FROM lines L WHERE user_id = $1 ORDER BY last_memory_date DESC",
        [userId]
      );
      return lines.rows;
    } catch (err) {
      throw err;
    }
  }

  async deleteLineById(lineId) {
    try {
      const deletedLine = await pool.query("DELETE FROM lines WHERE line_id = $1 RETURNING *", [
        lineId
      ]);
      if (!deletedLine.rows[0]) {
        throw NotFoundError('Line does not exist, cannot delete');
      }
      return deletedLine.rows[0];
    } catch (err) {
      throw err;
    }
  }
}

module.exports = LineService