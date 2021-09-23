const pool = require("../db/db");
const camelizeKeys = require("../db/utils");
const { NotFoundError } = require("../errors/errors");
const logger = require("../middleware/logger")

class MemoryService {
  constructor() {}

  async createMemory(lineId, title, description, latitude, longitude) {
    try {
      const newMemory = await pool.query(
        "INSERT INTO memories (line_id, title, description, creation_date, latitude, longitude) VALUES ($1, $2, $3, NOW(), $4, $5) RETURNING *",
        [lineId, title, description, latitude, longitude]
      );
      return camelizeKeys(newMemory.rows[0]);
    } catch (err) {
      logger.logErrorWithoutRequest(err)
      throw err;
    }
  }

  async updateMemory(
    memoryId,
    lineId,
    title,
    description,
    latitude,
    longitude
  ) {
    try {
      const updatedMemory = await pool.query(
        `
        UPDATE memories
          SET line_id = COALESCE($1, line_id),
            title = COALESCE($2, title),
            description = COALESCE($3, description),
            latitude = COALESCE($4, latitude),
            longitude = COALESCE($5, longitude)
          WHERE memory_id = $6
          RETURNING *
        `,
        [lineId, title, description, latitude, longitude, memoryId]
      );
      return camelizeKeys(updatedMemory.rows[0]);
    } catch (err) {
      logger.logErrorWithoutRequest(err)
      throw err;
    }
  }

  async getAllMemoriesByLineId(lineId) {
    try {
      const memories = await pool.query(
        "SELECT * FROM memories WHERE line_id = $1",
        [lineId]
      );
      return camelizeKeys(memories.rows);
    } catch (err) {
      logger.logErrorWithoutRequest(err)
      throw err;
    }
  }

  async getMemoryByMemoryId(memoryId) {
    try {
      const memories = await pool.query(
        "SELECT * FROM memories WHERE memory_id = $1",
        [memoryId]
      );
      return camelizeKeys(memories.rows[0]);
    } catch (err) {
      logger.logErrorWithoutRequest(err)
      throw err;
    }
  }

  async deleteMemoryById(memoryId) {
    try {
      const deletedMemory = await pool.query(
        "DELETE FROM memories WHERE memory_id = $1 RETURNING *",
        [memoryId]
      );
      if (!deletedMemory.rows[0]) {
        throw new NotFoundError("Memory does not exist, cannot delete");
      }
      return camelizeKeys(deletedMemory.rows[0]);
    } catch (err) {
      logger.logErrorWithoutRequest(err)
      throw err;
    }
  }

  async getNumberOfMemoriesByDays(userId, month, year) {
    try {
      const numberOfMemories = await pool.query(
        `SELECT date_part('day',creation_date) as day, COUNT(memory_id) as number_of_memories
          FROM memories M JOIN lines L ON M.line_id = L.line_id
          WHERE L.user_id = $1
          AND date_part('month',creation_date) = $2
          AND date_part('year',creation_date) = $3
          GROUP BY date_part('day',creation_date)`,
        [userId, month, year]
      );
      return camelizeKeys(numberOfMemories.rows);
    } catch (err) {
      logger.logErrorWithoutRequest(err)
      throw err;
    }
  }

  async getMemoriesByDay(userId, day, month, year) {
    try {
      const memories = await pool.query(
        `SELECT M.*, (
            SELECT url FROM media WHERE memory_id = M.memory_id ORDER BY position LIMIT 1
          ) AS thumbnail_url 
          FROM memories M JOIN lines L ON M.line_id = L.line_id
          WHERE L.user_id = $1
          AND date_part('day',creation_date) = $2
          AND date_part('month',creation_date) = $3
          AND date_part('year',creation_date) = $4`,
        [userId, day, month, year]
      );
      return camelizeKeys(memories.rows);
    } catch (err) {
      logger.logErrorWithoutRequest(err)
      throw err;
    }
  }
}

module.exports = MemoryService;
