import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";
import openApiSpec from "./docs/openapi.js";
import { verifyHandshakeKey } from "./middleware/handshake.middleware.js";
import { generalLimiter } from "./middleware/rate-limit.middleware.js";
import { NODE_ENV, FRONTEND_BASE_URL } from "./config/env.js";
import prisma from "./config/prisma.js";

const app = express();

// Trust proxy for rate limiting behind reverse proxies (Render, etc.)
app.set("trust proxy", 1);

// CORS - restrict to known origins
const allowedOrigins = [
	FRONTEND_BASE_URL,
	"https://zoykah.com",
	"https://www.zoykah.com",
	"https://zoykah-dashboard.vercel.app",
];

if (NODE_ENV !== "production") {
	allowedOrigins.push("http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000");
}

app.use(cors({
	origin: (origin, callback) => {
		// Allow requests with no origin (mobile apps, curl, server-to-server)
		if (!origin) return callback(null, true);
		if (allowedOrigins.includes(origin)) {
			return callback(null, true);
		}
		return callback(new Error("Not allowed by CORS"));
	},
	credentials: true,
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
	maxAge: 86400, // Cache preflight for 24 hours
}));

app.use(helmet({
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			scriptSrc: ["'self'"],
			styleSrc: ["'self'", "'unsafe-inline'"],
			imgSrc: ["'self'", "data:", "https:"],
			connectSrc: ["'self'"],
			fontSrc: ["'self'"],
			objectSrc: ["'none'"],
			frameAncestors: ["'none'"],
		},
	},
	crossOriginResourcePolicy: { policy: "cross-origin" },
	crossOriginOpenerPolicy: { policy: "same-origin" },
	referrerPolicy: { policy: "strict-origin-when-cross-origin" },
	hsts: {
		maxAge: 31536000,
		includeSubDomains: true,
		preload: true,
	},
}));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));

// General rate limit on all API routes
app.use("/api", generalLimiter);

app.use("/api/uploads", express.static("public/uploads"));

app.get("/", (req, res) => {
	res.status(200).json({
		message: "Welcome to the Zoyka Backend API 🚀",
		documentation: "/api-docs",
		healthCheck: "/api/health"
	});
});

// In src/app.js
app.get('/api/health', async (req, res) => { // Changed path to match your JSON message
	try {
		// This confirms the DB is actually responding
		await prisma.$queryRaw`SELECT 1`; //
		res.json({ status: "Zoyka backend is running 🔥" }); //
	} catch (error) {
		console.error("Health Check Error:", error); // Add this to see the real DB error
		res.status(500).json({ error: "DB Connection failed" }); //
	}
});

// app.get("/api-docs.json", (req, res) => {
// 	res.json(openApiSpec);
// });

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

// app.use("/api", (req, res, next) => {
// 	if (req.method === "OPTIONS") return res.sendStatus(200);
// 	next();
// }, verifyHandshakeKey, routes);

app.use("/api", verifyHandshakeKey, routes);

app.use(errorHandler);

export default app;
