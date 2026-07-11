import ApiError from "../utils/ApiError.js";

/**
 * Check if the authenticated user has the required role(s)
 * @param  {...string} roles - Allowed roles (e.g. "seller", "admin")
 */
const roleMiddleware = (...roles) => {
  const allowedRoles = roles.flat(); // handles both roleMiddleware("seller") and roleMiddleware(["seller"])
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized — Please login first"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Forbidden — Role '${req.user.role}' is not allowed. Required: ${allowedRoles.join(" or ")}`
        )
      );
    }

    next();
  };
};

export default roleMiddleware;
