/**
 * Standardized JSON API response helpers
 */

export const sendSuccess = (res, data = {}, message = 'Operation successful', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res, message = 'Operation failed', statusCode = 400, details = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
  });
};
