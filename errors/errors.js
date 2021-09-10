class HTTPError extends Error {
  status;
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

class BadRequestError extends HTTPError {
  constructor(message) {
    super(message, 400);
  }
}

class UnauthorizedError extends HTTPError {
  constructor(message) {
    super(message, 401);
  }
}

class NotFoundError extends HTTPError {
  constructor(message) {
    super(message, 404);
  }
}

module.exports.HTTPError = HTTPError;
module.exports.BadRequestError = BadRequestError;
module.exports.UnauthorizedError = UnauthorizedError;
module.exports.NotFoundError = NotFoundError;