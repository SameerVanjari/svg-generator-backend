import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";
import dotenv from "dotenv";
import { processImageFromUrl } from "../src/utils";
import { generateAIImage } from "../src/service";

dotenv.config();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://ai-svg-gen.netlify.app"
  ); // You can restrict this to a specific domain instead of '*'
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" });
  }

  const { userinput } = req.body;

  if (!userinput) {
    return res
      .status(400)
      .json({ success: false, message: "userinput is required" });
  }

  try {
    const response = await generateAIImage(userinput);

    const images = await Promise.all(
      response?.map(async (image) => {
        const svg = await processImageFromUrl(image.url!, {
          qtres: 0.01,
          linefilter: false,
        });
        return { ...image, svg };
      })
    );

    res.status(200).json({
      success: true,
      message: "Generated icon successfully",
      data: { images },
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error?.message ?? error,
    });
  }
}
