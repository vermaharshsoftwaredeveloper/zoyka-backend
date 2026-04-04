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

const app = express();

app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
	res.json({ status: "Zoyka backend is running 🔥" });
});

app.get("/api-docs.json", (req, res) => {
	res.json(openApiSpec);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use("/api", verifyHandshakeKey, routes);

app.use(errorHandler);

export default app;
