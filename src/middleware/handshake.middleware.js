import ApiError from "../utils/api-error/index.js";
import { HANDSHAKE_KEY } from "../config/env.js";

export const verifyHandshakeKey = (req, res, next) => {
    const incomingKey = req.headers["x-api-key"];

    if (!incomingKey) {
        throw new ApiError(401, "Handshake failed: x-api-key header is missing.");
    }

    if (incomingKey !== HANDSHAKE_KEY) {
        throw new ApiError(403, "Handshake failed: Invalid x-api-key.");
    }

    next();
};