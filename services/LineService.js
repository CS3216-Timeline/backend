const pool = require('../db/db');
const camelizeKeys = require('../db/utils');
const { snakeCase } = require('lodash');
const {
  NotFoundError
} = require('../errors/errors');

class LineService {
  constructor() { }

  async createLine(userId, name, colorHex) {
    try {
      const newLine = await pool.query(
        "INSERT INTO lines (user_id, name, color_hex, last_updated_date) VALUES ($1, $2, $3, NOW()) RETURNING *",
        [userId, name, colorHex]
      );
      return camelizeKeys(newLine.rows[0]);
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
      if (!lines.rows[0]) {
        throw new NotFoundError('Line does not exist');
      }
      return camelizeKeys(lines.rows[0]);
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
      return camelizeKeys(lines.rows);
    } catch (err) {
      throw err;
    }
  }

  async getLineByLineIdWithMemoriesOrderByCreationDate(lineId) {
    try {
      const lineWithMemories = await pool.query(
        `SELECT L.line_id, L.user_id, L.name, L.color_hex, L.last_updated_date, 
        M.memory_id, M.title, M.description, M.creation_date, M.latitude, M.longitude, (
          SELECT url FROM media WHERE memory_id = M.memory_id ORDER BY position LIMIT 1
        ) as thumbnail_url
        FROM lines L LEFT JOIN memories M ON L.line_id = M.line_id
        WHERE L.line_id = $1 ORDER BY M.creation_date DESC`,
        [lineId]
      );
      if (!lineWithMemories.rows[0]) {
        throw new NotFoundError('Line does not exist');
      }
      return camelizeKeys(lineWithMemories.rows);
    } catch (err) {
      throw err;
    }
  }
  
  async getAllLinesByUserIdOrderByMostRecentChange(userId) {
    try {
      const lines = await pool.query(
        "SELECT * FROM lines WHERE user_id = $1 ORDER BY last_updated_date DESC;",
        [userId]
      );
      return camelizeKeys(lines.rows);
    } catch (err) {
      throw err;
    }
  }

  async updateLineByLineId(lineId, userId, name, colorHex) {
    const changeList = [];
    const columns = { "name": name, "color_hex": colorHex }
    for (var columnName in columns) {
      if (columns[columnName]) {
        changeList.push(columnName + " = '" + columns[columnName]+"'");
      }
    }

    try {
      if (changeList.length == 0) {
        throw BadRequestError("At least one change is required")
      }
      const changes = changeList.join(", ");
      console.log(changes);

      const updatedLine = await pool.query(`UPDATE lines SET ${changes} WHERE line_id = $1 AND user_id = $2 RETURNING *`, [
        lineId, userId
      ]);
      if (!updatedLine.rows[0]) {
        throw new NotFoundError('Line does not exist for the user, cannot update');
      }
      return camelizeKeys(updatedLine.rows[0]);
    } catch (err) {
      throw err;
    }
  }

    async deleteLineByLineId(lineId, userId) {
    try {
      const deletedLine = await pool.query("DELETE FROM lines WHERE line_id = $1 AND user_id = $2 RETURNING *", [
        lineId, userId
      ]);
      if (!deletedLine.rows[0]) {
        throw new NotFoundError('Line does not exist for the user, cannot delete');
      }
      return camelizeKeys(deletedLine.rows[0]);
    } catch (err) {
      throw err;
    }
  }
}

module.exports = LineService