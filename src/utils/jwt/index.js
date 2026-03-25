import jwt from "jsonwebtoken";

import { JWT_EXPIRES_IN, JWT_SECRET } from "../../config/env.js";
import ApiError from "../api-error/index.js";

/**
 * @typedef {Object} Payload
 * @property {string} id
 */

/**
 * @param {Payload} payload
 * @returns {string}
 */
export const generateToken = (payload, expiry) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiry || JWT_EXPIRES_IN });
};

/**
 * @param {string} token
 * @returns {Payload}
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, "Invalid token");
    }
    throw new ApiError(500, "Token verification failed", [error]);
  }
};
