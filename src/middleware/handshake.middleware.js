import crypto from "crypto";
import ApiError from "../utils/api-error/index.js";
import { HANDSHAKE_KEY } from "../config/env.js";

// Exact webhook paths that bypass handshake verification
const WEBHOOK_BYPASS_PATHS = [
    "/payments/webhook/payment",
];

export const verifyHandshakeKey = (req, res, next) => {
    // Skip handshake verification for exact webhook paths only
    if (WEBHOOK_BYPASS_PATHS.includes(req.path)) {
        return next();
    }

    const incomingKey = req.headers["x-api-key"];

    if (!incomingKey || typeof incomingKey !== "string") {
        return next(new ApiError(401, "Handshake failed: x-api-key header is missing."));
    }

    // Use timing-safe comparison to prevent timing attacks
    const keyBuffer = Buffer.from(HANDSHAKE_KEY);
    const incomingBuffer = Buffer.from(incomingKey);

    if (keyBuffer.length !== incomingBuffer.length ||
        !crypto.timingSafeEqual(keyBuffer, incomingBuffer)) {
        return next(new ApiError(403, "Handshake failed: Invalid x-api-key."));
    }

    next();
};