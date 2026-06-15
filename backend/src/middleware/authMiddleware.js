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
      console.warn("⚠️ No auth token provided");
      throw new ApiError(401, "Unauthorized — No token provided");
    }

    // 2. Verify token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token verified, user ID:", decodedToken.id);
    } catch (jwtErr) {
      console.error("❌ JWT verification failed:", jwtErr.message);
      throw new ApiError(401, "Unauthorized — Invalid or expired token");
    }

    // 3. Find user by ID from token
    if (!decodedToken.id) {
      console.error("❌ No user ID in decoded token:", decodedToken);
      throw new ApiError(401, "Unauthorized — Invalid token structure");
    }

    const user = await User.findById(decodedToken.id).select(
      "-password -refreshToken"
    );

    if (!user) {
      console.error("❌ User not found for ID:", decodedToken.id);
      throw new ApiError(401, "Unauthorized — User not found");
    }

    console.log("✅ User authenticated:", user._id, user.email);

    // 4. Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("🚨 Auth middleware error:", error.message);
    next(
      error instanceof ApiError
        ? error
        : new ApiError(401, "Unauthorized — Invalid or expired token")
    );
  }
};

export default authMiddleware;
