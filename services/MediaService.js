const pool = require("../db/db");
const camelizeKeys = require("../db/utils");
const { BadRequestError } = require("../errors/errors");
const logger = require("../logs/logger");

class MediaService {
  constructor() {}

  async createMedia(url, memoryId, position) {
    try {
      const newMedia = await pool.query(
        "INSERT INTO media (url, memory_id, position) VALUES ($1, $2, $3) RETURNING *",
        [url, memoryId, position]
      );
      return camelizeKeys(newMedia.rows[0]);
    } catch (err) {
      logger.logErrorWithoutRequest(err);
      throw err;
    }
  }

  async getAllMediaByMemory(memoryId) {
    try {
      const media = await pool.query(
        "SELECT * FROM media WHERE memory_id = $1 ORDER BY position",
        [memoryId]
      );
      return camelizeKeys(media.rows);
    } catch (err) {
      logger.logErrorWithoutRequest(err);
      throw err;
    }
  }

  async getMediaByMediaId(mediaId) {
    try {
      const media = await pool.query(
        "SELECT * FROM media WHERE media_id = $1 ORDER BY position",
        [mediaId]
      );
      return camelizeKeys(media.rows[0]);
    } catch (err) {
      logger.logErrorWithoutRequest(err);
      throw err;
    }
  }

  async deleteMediaById(mediaId) {
    try {
      const deletedMedia = await pool.query(
        "DELETE FROM media WHERE media_id = $1 RETURNING *",
        [mediaId]
      );
      return camelizeKeys(deletedMedia.rows[0]);
    } catch (err) {
      logger.logErrorWithoutRequest(err);
      throw err;
    }
  }

  async deleteMediaByMemory(memoryId) {
    try {
      const deletedMedia = await pool.query(
        "DELETE FROM media WHERE memory_id = $1 RETURNING *",
        [memoryId]
      );
      return camelizeKeys(deletedMedia.rows);
    } catch (err) {
      logger.logErrorWithoutRequest(err);
      throw err;
    }
  }

  async deleteMediaByLine(userId, lineId) {
    try {
      const deletedMedia = await pool.query(
        `
        DELETE FROM media D
        WHERE EXISTS (
          SELECT *
          FROM memories M
          JOIN lines L ON M.line_id = L.line_id
          WHERE memory_id = D.memory_id
          AND user_id = $1
          AND L.line_id = $2
        ) RETURNING *
        `,
        [userId, lineId]
      );
      return camelizeKeys(deletedMedia.rows);
    } catch (err) {
      logger.logErrorWithoutRequest(err);
      throw err;
    }
  }

  async getMediaWithMemoryAndLineInformation(mediaId) {
    try {
      const media = await pool.query(
        `SELECT * FROM MEDIA NATURAL JOIN MEMORIES NATURAL JOIN LINES WHERE media_id = $1`,
        [mediaId]
      );
      if (media.rows.length === 0) {
        return {};
      }
      return camelizeKeys(media.rows);
    } catch (err) {
      logger.logErrorWithoutRequest(err);
      throw err;
    }
  }

  async updatePositions(updates) {
    try {
      await pool.query("BEGIN");
      for (let i = 0; i < updates.length; i++) {
        const newPosition = updates[i]["position"];
        const mediaId = updates[i]["mediaId"];
        await pool.query(
          "UPDATE media SET position=$1 where media_id=$2 RETURNING *",
          [newPosition, mediaId]
        );
      }
      await pool.query("COMMIT");
    } catch (err) {
      logger.logErrorWithoutRequest(err);
      await pool.query("ROLLBACK");
      throw new BadRequestError("Invalid positioning");
    }
  }
}

module.exports = MediaService;
