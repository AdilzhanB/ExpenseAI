export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    message: 'Internal server error',
    status: 500
  };

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = 'Validation failed';
    error.status = 400;
    error.details = err.details;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.status = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.status = 401;
  }

  // SQLite errors
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    error.message = 'Resource already exists';
    error.status = 409;
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGN') {
    error.message = 'Referenced resource does not exist';
    error.status = 400;
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error.message = 'File too large';
    error.status = 413;
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error.message = 'Too many files';
    error.status = 400;
  }

  // AI service errors
  if (err.name === 'AIServiceError') {
    error.message = 'AI service unavailable';
    error.status = 503;
  }

  // Custom application errors
  if (err.isOperational) {
    error.message = err.message;
    error.status = err.status || 400;
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    delete error.details;
    if (error.status === 500) {
      error.message = 'Something went wrong';
    }
  } else {
    // Include stack trace in development
    error.stack = err.stack;
  }

  res.status(error.status).json(error);
}

export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.status = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
