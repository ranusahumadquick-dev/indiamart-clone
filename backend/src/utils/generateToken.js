import jwt from "jsonwebtoken";

/**
 * Generate a JWT access token
 * @param {object} payload - Data to embed in token (e.g. { id, role })
 * @returns {string} Signed JWT token
 */
const generateAccessToken = (payload) => {
  // Use JWT_EXPIRE if provided for consistency with .env naming
  const expiresIn = process.env.JWT_EXPIRE || process.env.JWT_ACCESS_EXPIRY || "1d";
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Generate a JWT refresh token (long-lived)
 * @param {object} payload - Data to embed in token
 * @returns {string} Signed JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d",
  });
};

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @param {string} secret - Secret key to use
 * @returns {object} Decoded payload
 */
const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};

export { generateAccessToken, generateRefreshToken, verifyToken };
