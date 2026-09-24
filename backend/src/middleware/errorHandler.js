import { env } from '../config/env.js';

/**
 * Centralized Error Handling Middleware
 * Prevents leaking stack traces to clients while formatting clean JSON responses.
 */
export const errorHandler = (err, req, res, next) => {
  // Log error internally for administrator/developer debugging
  console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err.message);

  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'An unexpected internal server error occurred.';
  let errors = null;

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error: Some fields are invalid or missing.';
    errors = Object.values(err.errors).map((e) => e.message);
  }

  // Handle Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `Duplicate entry: A record with this ${field} already exists.`;
  }

  // Handle CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format for resource '${err.path}'.`;
  }

  // Handle Database not connected error
  if (message.includes('MONGODB_URI is not configured') || message.includes('buffering timed out')) {
    statusCode = 503;
    message = 'Database is currently unconfigured or unavailable. Please configure MONGODB_URI in backend/.env.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(env.NODE_ENV === 'development' && { stack: err.stack }), // Only show stack in dev if explicitly configured
  });
};

export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found on this server.`,
  });
};
