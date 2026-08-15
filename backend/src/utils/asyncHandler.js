/**
 * Wraps async route handlers to automatically catch errors
 * Eliminates the need for try/catch in every controller
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export default asyncHandler;
