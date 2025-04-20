import dotenv from "dotenv";
dotenv.config();

import { fileURLToPath } from "url";
import { dirname } from "path";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { generateSvgService } from "./service.js";
import { handle } from "hono/vercel";

const app = new Hono().basePath("/api");

app.use(logger());
app.use(
  "/*",
  cors({
    origin: [
      "http://localhost:5173",
      // "https://e4cc-2409-40c2-123c-daa5-6d9f-8c63-9976-ad4f.ngrok-free.app",
      "*",
    ],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

app.get("/hello", (c) => {
  return c.text("Hello Hono!");
});

app.post("/generate-svg", generateSvgService);

// These are needed to get __filename and __dirname in ESM
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// if (process.argv[1] === __filename) {
//   serve(
//     {
//       fetch: app.fetch,
//       port: 8787,
//     },
//     (info: any) => {
//       console.log(`Server is running on http://localhost:${info.port}`);
//     }
//   );
// }

// export default app;
// ✅ Export for Vercel
export const GET = handle(app);
export const POST = handle(app);
export default handle(app);
