import { sendError } from '../utils/apiResponse.js';

export const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    const errorDetails = error.errors?.map(err => ({
      field: err.path.join('.'),
      message: err.message
    })) || error.message;
    return sendError(res, 'Validation failed for request body', 422, errorDetails);
  }
};

export const validateQuery = (schema) => (req, res, next) => {
  try {
    req.query = schema.parse(req.query);
    next();
  } catch (error) {
    const errorDetails = error.errors?.map(err => ({
      field: err.path.join('.'),
      message: err.message
    })) || error.message;
    return sendError(res, 'Validation failed for query parameters', 422, errorDetails);
  }
};
