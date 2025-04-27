import express, { Handler } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { generateIconHandler, imageUrlProxyHandler } from "./service";

dotenv.config();

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

app.get("/hello", (req, res) => {
  res.status(200).json({ message: "Hello from the server!" });
});

app.post("/api/generate-svg", generateIconHandler as Handler);

app.get("/proxy", imageUrlProxyHandler as Handler);

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
