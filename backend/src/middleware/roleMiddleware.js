import ApiError from "../utils/ApiError.js";

/**
 * Check if the authenticated user has the required role(s)
 * @param  {...string} roles - Allowed roles (e.g. "seller", "admin")
 */
const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized — Please login first"));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Forbidden — Role '${req.user.role}' is not allowed. Required: ${roles.join(" or ")}`
        )
      );
    }

    next();
  };
};

export default roleMiddleware;
