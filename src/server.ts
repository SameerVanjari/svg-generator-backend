import express, { Handler } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { generateIconHandler, imageUrlProxyHandler } from "./controller/image";
import {
  getAdmin,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "./controller/auth";
import { PrismaClient } from "@prisma/client";
import cookieParser from "cookie-parser";
import { authenticateToken, optionalAuth } from "./middlewares/auth";
import { createClient, RedisClientType } from "redis";
import { rateLimitMiddleware } from "./middlewares/rate-limiter";

dotenv.config();

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 8787;

export const redisClient: RedisClientType = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => {
  console.error("Redis connection error:", err);
});

redisClient
  .connect()
  .then(() => {
    console.log("Redis connected successfully");

    // Initialize rate limiters after Redis connection
    const { initializeRateLimiters } = require("./utils");
    initializeRateLimiters();
  })
  .catch((err) => {
    console.error("Failed to connect to Redis:", err);
  });

app.use(
  cors({
    origin: ["https://ai-svg-gen.netlify.app", "http://localhost:5173"], // adjust as needed
    methods: ["POST", "OPTIONS", "GET"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);
app.set("trust proxy", 1); // trust first proxy
app.use(express.json());
app.use(cookieParser());

app.get("/hello", (req, res) => {
  res.status(200).json({ message: "Hello from the server!" });
});

// auth
app.post("/api/register", registerUser as Handler);

app.post("/api/login", loginUser as Handler);

app.post("/api/logout", logoutUser as Handler);

// 🔐 Protected route
app.get("/api/me", authenticateToken, getCurrentUser as Handler);

// 🔐 Admin route example
app.get("/api/admin", authenticateToken, getAdmin as Handler);

// image generation
app.post(
  "/api/generate-svg",
  optionalAuth,
  rateLimitMiddleware,
  generateIconHandler as Handler
);

app.get("/proxy", imageUrlProxyHandler as Handler);

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
