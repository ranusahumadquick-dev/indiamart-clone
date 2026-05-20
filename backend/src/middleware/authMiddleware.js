import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

/**
 * Verify JWT token from Authorization header or cookies
 * Attaches the logged-in user to req.user
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 1. Get token from header or cookies
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized — No token provided");
    }

    // 2. Verify token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find user by ID from token
    const user = await User.findById(decodedToken.id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Unauthorized — Invalid token");
    }

    // 4. Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(401, "Unauthorized — Invalid or expired token")
    );
  }
};

export default authMiddleware;
