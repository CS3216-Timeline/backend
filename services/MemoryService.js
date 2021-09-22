const pool = require("../db/db");
const camelizeKeys = require("../db/utils");
const { NotFoundError } = require("../errors/errors");

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
      throw err;
    }
  }

  async updateMemory(
    memoryId,
    lineId,
    title,
    description,
    creationDate,
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
            creation_date = COALESCE($4, creation_date),
            latitude = COALESCE($5, latitude),
            longitude = COALESCE($6, longitude)
          WHERE memory_id = $7
          RETURNING *
        `,
        [
          lineId,
          title,
          description,
          creationDate,
          latitude,
          longitude,
          memoryId,
        ]
      );
      return camelizeKeys(updatedMemory.rows[0]);
    } catch (err) {
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
      throw err;
    }
  }
}

module.exports = MemoryService;
