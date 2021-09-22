const pool = require("../db/db");
const camelizeKeys = require("../db/utils");
const { NotFoundError } = require("../errors/errors");

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
      throw err;
    }
  }

  async getAllMediaByMemory(memoryId) {
    try {
      const media = await pool.query(
        "SELECT * FROM media WHERE memory_id = $1",
        [memoryId]
      );
      return camelizeKeys(media.rows);
    } catch (err) {
      throw err;
    }
  }

  async getMediaByMediaId(mediaId) {
    try {
      const media = await pool.query(
        "SELECT * FROM media WHERE media_id = $1",
        [mediaId]
      );
      return camelizeKeys(media.rows[0]);
    } catch (err) {
      throw err;
    }
  }

  async deleteMediaById(mediaId) {
    try {
      const deletedMedia = await pool.query(
        "DELETE FROM media WHERE media_id = $1 RETURNING *",
        [mediaId]
      );
      if (!deletedMedia.rows[0]) {
        throw new NotFoundError("Media does not exist, cannot delete");
      }
      return camelizeKeys(deletedMedia.rows[0]);
    } catch (err) {
      throw err;
    }
  }

  async deleteMediaByMemory(memoryId) {
    try {
      const deletedMedia = await pool.query(
        "DELETE FROM media WHERE memory_id = $1 RETURNING *",
        [memoryId]
      );
      if (!deletedMedia.rows[0]) {
        throw new NotFoundError("Memory does not exist, cannot delete");
      }
      return camelizeKeys(deletedMedia.rows[0]);
    } catch (err) {
      throw err;
    }
  }
}

module.exports = MediaService;
