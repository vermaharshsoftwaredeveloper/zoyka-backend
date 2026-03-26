import ApiError from "../utils/api-error/index.js";
import { verifyToken } from "../utils/jwt/index.js";

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authorization token is required"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyToken(token);

    req.user = {
      id: payload.id,
      role: payload.role,
    };

    next();
  } catch (error) {
    return next(new ApiError(401, "Invalid or expired token"));
  }
};

export const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user?.id) {
      return next(new ApiError(401, "Unauthorized"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "Forbidden: insufficient permissions"));
    }

    next();
  };
};

export const requireAdmin = requireRoles("ADMIN", "SUPER_ADMIN");
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, `Access denied. Requires one of these roles: ${allowedRoles.join(', ')}`));
    }
    next();
  };
};
