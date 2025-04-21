import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";
import dotenv from "dotenv";
import { processImageFromUrl } from "../src/utils";

dotenv.config();

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const openai = new OpenAI({
      apiKey: process.env.IMAGE_AI_KEY!,
      baseURL: "https://api.openai.com/v1",
    });

    const prompt = `A clean, minimalistic black-and-white line drawing icon in vector style, representing the concept of '${userinput}'.`;

    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt,
      n: 2,
      size: "1024x1024",
    });

    const images = await Promise.all(
      response.data.map(async (image) => {
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
