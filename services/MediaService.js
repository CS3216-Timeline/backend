const pool = require('../db/db');
const {
  NotFoundError
} = require('../errors/errors');

class MediaService {
  constructor() { }

  async createMedia(url, memoryId) {
    try {
      const newMedia = await pool.query(
        "INSERT INTO media (url, memory_id) VALUES ($1, $2) RETURNING *",
        [url, memoryId]
      );
      return newMedia.rows[0];
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
      return media.rows;
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
      return media.rows[0];
    } catch (err) {
      throw err;
    }
  }

  async deleteMediaById(mediaId) {
    try {
      const deletedMedia = await pool.query("DELETE FROM media WHERE media_id = $1 RETURNING *", [
        mediaId
      ]);
      if (!deletedMedia.rows[0]) {
        throw NotFoundError('Media does not exist, cannot delete');
      }
      return deletedMedia.rows[0];
    } catch (err) {
      throw err;
    }
  }
}

module.exports = MediaService