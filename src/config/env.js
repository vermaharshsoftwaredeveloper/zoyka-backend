import "dotenv/config";

export const NODE_ENV = process.env.NODE_ENV || "development";

export const PORT = process.env.PORT || 3000;

export const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/zoykah";

export const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

// SMTP configuration for nodemailer
export const SMTP_HOST = process.env.SMTP_HOST || "smtp.example.com";
export const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465;
export const SMTP_USER = process.env.SMTP_USER || "jithendrabathala@gmail.com";
export const SMTP_PASS = process.env.SMTP_PASS || "your_smtp_password";

// Email configuration
export const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS || "jithendrabathala@gmail.com";
export const EMAIL_NAME = process.env.EMAIL_NAME || "Zoykah Support";

// Redis configuration
export const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
