import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { generateSvgService } from "./service.js";
import dotenv from "dotenv";
dotenv.config();
const app = new Hono().basePath("/api");
app.use(logger());
app.use("/*", cors({
    origin: [
        "http://localhost:5173",
        // "https://e4cc-2409-40c2-123c-daa5-6d9f-8c63-9976-ad4f.ngrok-free.app",
        "*",
    ],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
}));
app.get("/hello", (c) => {
    return c.text("Hello Hono!");
});
app.post("/generate-svg", generateSvgService);
// Local dev only
if (require.main === module) {
    serve({
        fetch: app.fetch,
        port: 8787,
    }, (info) => {
        console.log(`Server is running on http://localhost:${info.port}`);
    });
}
export default app;
