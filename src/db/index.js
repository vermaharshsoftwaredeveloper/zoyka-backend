import prisma from "../config/prisma.js";

export const connectDB = async () => {
  try {
    // We remove $connect() and process.exit
    // We just do a simple ping to verify the connection
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connection verified successfully.");
  } catch (error) {
    console.error("Database connection verification failed:", error);
    // DO NOT process.exit(1) here! 
    // Just let the error flow so Lambda stays alive to show us the log.
    throw error;
  }
};