import "dotenv/config";

export const NODE_ENV = process.env.NODE_ENV || "development";

export const PORT = process.env.PORT || 3001;

const DEFAULT_API_BASE_URL =
	NODE_ENV === "production" ? "https://zoyka-backend.onrender.com" : `http://localhost:${PORT}`;

export const API_BASE_URL = process.env.API_BASE_URL || DEFAULT_API_BASE_URL;

const _dbUrl = process.env.DATABASE_URL;
if (!_dbUrl && NODE_ENV === "production") {
	throw new Error("FATAL: DATABASE_URL must be set in production");
}
export const DATABASE_URL = _dbUrl || "postgresql://postgres:postgres@localhost:5432/zoykah";

const _jwtSecret = process.env.JWT_SECRET;
if (!_jwtSecret) {
	if (NODE_ENV === "production") {
		throw new Error("FATAL: JWT_SECRET must be set in production");
	}
	console.warn("WARNING: JWT_SECRET not set. Using insecure default for development only.");
}
export const JWT_SECRET = _jwtSecret || "dev-only-insecure-jwt-secret-change-me";

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

// SMTP configuration for nodemailer
export const SMTP_HOST = process.env.SMTP_HOST || "smtp.example.com";
export const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465;
export const SMTP_USER = process.env.SMTP_USER || "";
export const SMTP_PASS = process.env.SMTP_PASS || "";

// Email configuration
export const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS || "";
export const EMAIL_NAME = process.env.EMAIL_NAME || "Zoykah Support";

// Redis configuration
export const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Handshake Key Configuration
const _handshakeKey = process.env.HANDSHAKE_KEY;
if (!_handshakeKey && NODE_ENV === "production") {
	throw new Error("FATAL: HANDSHAKE_KEY must be set in production");
}
export const HANDSHAKE_KEY = _handshakeKey || "dev-only-handshake-key";

// Cashfree Payment Configuration
export const CASHFREE_ENVIRONMENT = process.env.CASHFREE_ENVIRONMENT || "sandbox";
export const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || "";
export const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || "";
export const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "http://localhost:5173";
export const FRONTEND_BASE_URL2 = process.env.FRONTEND_BASE_URL2 || "http://localhost:5174";
export const DASHBOARD_BASE_URL = process.env.DASHBOARD_BASE_URL || "http://localhost:5175";
export const DASHBOARD_BASE_URL2 = process.env.DASHBOARD_BASE_URL2 || "http://localhost:5176";

// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
