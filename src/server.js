import app from "./app.js";
import { PORT } from "./config/env.js";
import { connectDB } from "./db/index.js";

const startApp = () => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

const startServer = async () => {
  try {
    await connectDB();
    startApp();
  } catch (error) {
    console.error("Error starting the server:", error);
    process.exit(1);
  }
};

startServer();
