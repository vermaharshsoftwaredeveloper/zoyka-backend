import Redis from "ioredis";
import { REDIS_URL } from "./env.js";

const redisClient = new Redis(REDIS_URL);

export default redisClient;
