import { Canvas, Image } from "canvas";
import ImageTracer from "imagetracerjs";

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
