import { Canvas, Image } from "canvas";
// @ts-ignore
import ImageTracer from "imagetracerjs";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { redisClient } from "./server";
import { RedisClientType } from "redis";

/**
 * Processes an image from a given URL and converts it into an SVG string.
 *
 * This function fetches an image from the provided URL, draws it onto a canvas,
 * extracts its image data, and then traces the image to generate an SVG string
 * using ImageTracer.js. It supports additional tracing options through the `options` parameter.
 *
 * @param imageUrl - The URL of the image to process.
 * @param options - Optional configuration for the ImageTracer.js tracing process.
 * @returns A promise that resolves to the generated SVG string or rejects with an error if processing fails.
 */
export const processImageFromUrl = (imageUrl: string, options = {}) => {
  return new Promise(async (resolve, reject) => {
    // Changed to async to use await
    let img;
    let canvas;
    let context;

    try {
      // console.log("imageUrl => ", imageUrl);

      // 1. Fetch the image data using node-fetch
      const response = await fetch(imageUrl); // Await the fetch
      if (!response.ok) {
        reject(
          new Error(
            `Failed to fetch image: ${response.status} ${response.statusText}`
          )
        );
        return;
      }

      const arrayBuffer = await response?.arrayBuffer(); // Await the arrayBuffer
      const imageBuffer = Buffer.from(arrayBuffer);

      // 2. Create an Image object from the fetched buffer
      img = new Image();
      img.src = imageBuffer;

      // console.log("image => ", img);

      // 3. Create a Canvas and draw the image
      canvas = new Canvas(img.width, img.height);
      context = canvas.getContext("2d");
      console.log("canvas => ", canvas);
      context.drawImage(img, 0, 0);

      // 4. Get the image data from the canvas.
      const imageData = context.getImageData(0, 0, img.width, img.height);

      // 5. Trace the image using ImageTracer.js.
      const svgString = ImageTracer.imagedataToSVG(imageData, options);
      resolve(svgString);
    } catch (error: any) {
      reject(new Error(`Error processing image: ${error.message}`));
    }
  });
};

/**
 * Sanitizes an SVG string to mitigate potential security risks such as XSS attacks.
 *
 * This function performs the following sanitization steps:
 * 1. Encodes basic HTML entities (`&`, `<`, `>`).
 * 2. Removes all HTML comments.
 * 3. Removes or escapes unsafe attributes (e.g., `onload`, `onerror`, `onclick`, etc.)
 *    and `<script>` tags to prevent the execution of malicious scripts.
 * 4. Sanitizes inline CSS styles by neutralizing potentially dangerous expressions
 *    (e.g., `expression:`) and URLs (e.g., `url()`).
 *
 * **Note:** This implementation provides basic sanitization and may not cover all edge cases
 * or advanced SVG attack vectors. For production use, consider leveraging a dedicated
 * SVG sanitization library for more robust protection.
 *
 * @param svgString - The raw SVG string to be sanitized.
 * @returns The sanitized SVG string.
 */
export function sanitizeSVG(svgString: string) {
  // 1.  HTML Entity Encoding (Basic)
  svgString = svgString
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Remove Comments (More robust)
  svgString = svgString.replace(/<!--[\s\S]*?-->/g, "");

  // 3. Remove or Escape Unsafe Attributes (Example: script)
  svgString = svgString.replace(
    /<[^>]*\s(onload|onerror|onclick|on\w+)\s*=\s*['"][^'"]*['"][^>]*>/gi,
    ""
  );
  svgString = svgString.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

  // 4.  CSS Sanitization (basic - more complex would need CSS parser)
  svgString = svgString.replace(/style="[^"]*"/gi, (match) => {
    let sanitizedStyle = match.replace(/expression\s*:/gi, "SAFE_EXPRESSION:"); // try to neutralize expressions
    sanitizedStyle = sanitizedStyle.replace(/url\s*\(/gi, "SAFE_URL(");
    return sanitizedStyle;
  });

  return svgString;
}

let anonLimiter: RateLimiterRedis;
let userLimiter: RateLimiterRedis;

redisClient
  ?.connect()
  .then(() => {
    console.log("Redis connected, initializing limiters...");

    anonLimiter = new RateLimiterRedis({
      storeClient: redisClient as RedisClientType,
      keyPrefix: "anon",
      points: 3, // 3 requests
      duration: 24 * 60 * 60, // per 24 hours
    });

    userLimiter = new RateLimiterRedis({
      storeClient: redisClient as RedisClientType,
      keyPrefix: "user",
      points: 10, // 10 requests
      duration: 24 * 60 * 60, // per 24 hours
    });

    console.log("Limiters initialized successfully");
  })
  .catch((err) => {
    console.error("Failed to connect to Redis:", err);
  });

console.log("Redis client state:", redisClient);

export { anonLimiter, userLimiter };

const createLimiter = (points: number, duration: number) =>
  new RateLimiterRedis({
    storeClient: redisClient,
    points,
    duration,
    keyPrefix: "rate",
  });

let guestLimiter: RateLimiterRedis;
let memberLimiter: RateLimiterRedis;
let premiumLimiter: RateLimiterRedis;

export const initializeRateLimiters = () => {
  console.log("Initializing rate limiters...");

  guestLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    useRedisPackage: true,
    points: 2,
    duration: 86400,
    keyPrefix: "rate",
  });

  console.log("Guest limiter initialized:", guestLimiter);

  memberLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    points: 5,
    duration: 86400,
    keyPrefix: "rate",
  });

  console.log("Member limiter initialized:", memberLimiter);

  premiumLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    points: 20,
    duration: 86400,
    keyPrefix: "rate",
  });

  console.log("Premium limiter initialized:", premiumLimiter);
};

export { guestLimiter, memberLimiter, premiumLimiter };
