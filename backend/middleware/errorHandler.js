/**
 * Standardized JSON error handler replicating Java GlobalExceptionHandler
 */
class AppError extends Error {
  constructor(message, status = 400, code = 'BAD_REQUEST', errors = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

class ResourceNotFoundException extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class AccountDisabledException extends AppError {
  constructor(message = 'Player account is deactivated or ineligible.') {
    super(message, 403, 'ACCOUNT_DISABLED');
  }
}

class EventUnavailableException extends AppError {
  constructor(message = 'The event is not currently accepting players.') {
    super(message, 400, 'BAD_REQUEST');
  }
}

class InvalidLevelTransitionException extends AppError {
  constructor(message = 'Invalid level transition.') {
    super(message, 400, 'BAD_REQUEST');
  }
}

class DuplicateLoginException extends AppError {
  constructor(message = 'Duplicate login detected.') {
    super(message, 409, 'CONFLICT');
  }
}

class IncompleteLevelContentException extends AppError {
  constructor(message = 'Level content is incomplete.') {
    super(message, 422, 'UNPROCESSABLE_ENTITY');
  }
}

function getReasonPhrase(status) {
  switch (status) {
    case 400: return 'Bad Request';
    case 401: return 'Unauthorized';
    case 403: return 'Forbidden';
    case 404: return 'Not Found';
    case 409: return 'Conflict';
    case 422: return 'Unprocessable Entity';
    case 429: return 'Too Many Requests';
    case 500: return 'Internal Server Error';
    default: return 'Error';
  }
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const reason = getReasonPhrase(status);
  const code = err.code || (status === 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR');
  const message = err.message || 'An unexpected error occurred';

  if (status >= 500) {
    console.error('Unhandled Server Error:', err);
  }

  const responseBody = {
    status,
    error: reason,
    code,
    message,
    timestamp: new Date().toISOString()
  };

  if (err.errors) {
    responseBody.errors = err.errors;
  }

  res.status(status).json(responseBody);
}

module.exports = {
  AppError,
  ResourceNotFoundException,
  AccountDisabledException,
  EventUnavailableException,
  InvalidLevelTransitionException,
  DuplicateLoginException,
  IncompleteLevelContentException,
  errorHandler,
  getReasonPhrase
};
