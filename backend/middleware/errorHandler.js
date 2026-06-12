const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Always log full error internally
  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`);
  if (err.stack) logger.error(err.stack);

  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'An unexpected error occurred';

  // Map specific DB / library errors to clean user-facing messages
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'This record already exists.';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'A referenced record does not exist.';
  } else if (err.code === 'ER_BAD_FIELD_ERROR') {
    statusCode = 500;
    message = 'Internal server error. Please contact support.';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired authentication token.';
  }

  // Never expose stack traces to client — only clean messages
  res.status(statusCode).json({
    success: false,
    data: null,
    message,
    error: null   // stack traces are NEVER sent to client
  });
};

module.exports = errorHandler;
