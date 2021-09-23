const LineService = require("./LineService");
const lineService = new LineService();
const MediaService = require("./MediaService");
const mediaService = new MediaService();
const MemoryService = require("./MemoryService");
const memoryService = new MemoryService();

async function checkIfMemoryExists(memoryId) {
  const memory = await memoryService.getMemoryByMemoryId(memoryId);
  return memory !== undefined;
}

async function checkIfMediaExists(mediaId) {
  const media = await mediaService.getMediaByMediaId(mediaId);
  return media !== undefined;
}

async function checkIfUserIsMediaOwner(userId, mediaId) {
  const media = await mediaService.getMediaByMediaId(mediaId);
  const memoryId = media["memoryId"];
  return checkIfUserIsMemoryOwner(userId, memoryId);
}

async function checkIfUserIsMemoryOwner(userId, memoryId) {
  const memory = await memoryService.getMemoryByMemoryId(memoryId);
  const userLines = await lineService.getAllLinesByUserId(userId);
  memoryLineId = memory["lineId"];

  for (var i = 0; i < userLines.length; i += 1) {
    line = userLines[i];
    if (memoryLineId === line["lineId"]) {
      return true;
    }
  }
  return false;
}

async function checkIfUserIsLineOwner(userId, lineId) {
  const line = await lineService.getLineByLineId(lineId);
  return line["userId"] === userId;
}

async function numberOfMediaInMemory(memoryId) {
  const media = await mediaService.getAllMediaByMemory(memoryId);
  return media.length;
}

async function checkIfMemoryIsValidUserMemory(memoryId, userId) {
  const memoryInfo = await memoryService.getMemoryWithLineInformation(memoryId);
  return memoryInfo["userId"] === userId;
}

async function checkIfMediaIsValidUserMedia(mediaId, userId) {
    const mediaInfo = await mediaService.getMediaWithMemoryAndLineInformation(mediaId);
    return mediaInfo["userId"] === userId;
  }

function isValidDate(year, month, day) {
  date = new Date(`${year}/${month}/${day}`);
  return date instanceof Date && !isNaN(date);
}

module.exports = {
  checkIfMemoryExists,
  checkIfMediaExists,
  checkIfUserIsMediaOwner,
  checkIfUserIsMemoryOwner,
  checkIfUserIsLineOwner,
  isValidDate,
  checkIfMemoryIsValidUserMemory,
  numberOfMediaInMemory,
  checkIfMediaIsValidUserMedia
};
