const winston = require("winston");

const logConfig = {
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.timestamp({
      format: "MMM-DD-YYYY HH:mm:ss",
    }),
    winston.format.printf(
      (info) => `${info.level}: ${[info.timestamp]}: ${info.message}`
    )
  ),
};

class Logger {
  constructor() {
    this.logger = winston.createLogger(logConfig);
  }

  #newLogWithReq(req, level, message) {
    const url = req.baseUrl + req.path;
    this.logger.log({
      message: `${url}: ${message}`,
      level,
    });
  }

  #newLogWithoutReq(level, message) {
    this.logger.log({
      message: message,
      level,
    });
  }

  logInfo(req, message) {
    this.#newLogWithReq(req, "info", message);
  }

  logError(req, error) {
    this.#newLogWithReq(req, "error", error.toString());
  }

  logWithoutRequest(level, message) {
    this.#newLogWithoutReq(level, message);
  }

  logErrorWithoutRequest(error) {
    this.#newLogWithoutReq("error", error.toString());
  }
}

module.exports = new Logger();
