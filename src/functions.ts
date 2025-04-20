import { handle } from "hono/netlify";
import app from "./index.js";

export const handler = handle(app);
