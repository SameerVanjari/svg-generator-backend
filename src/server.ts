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
import { authenticateToken } from "./middlewares/auth";

dotenv.config();

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 8787;

app.use(
  cors({
    origin: ["https://ai-svg-gen.netlify.app", "http://localhost:5173"], // adjust as needed
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
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
app.post("/api/generate-svg", generateIconHandler as Handler);

app.get("/proxy", imageUrlProxyHandler as Handler);

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
