import OpenAI from "openai";
import { Request, Response } from "express";
import dotenv from "dotenv";
import { processImageFromUrl } from "./utils";

dotenv.config();

export const generateIconHandler = async (req: Request, res: Response) => {
  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Handle CORS preflight
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

    // const images = await Promise.all(
    //   response?.map(async (image) => {
    //     const svg = await processImageFromUrl(image.url!, {
    //       qtres: 0.01,
    //       linefilter: false,
    //     });
    //     return { ...image, svg };
    //   })
    // );
    const images = response?.map((image) => {
      return { url: image.url };
    });

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
};

export const generateAIImage = async (userinput: string) => {
  if (!process.env.IMAGE_AI_KEY) {
    throw new Error("OpenAI API key is not set in environment variables");
  }

  const openai = new OpenAI({
    apiKey: process.env.IMAGE_AI_KEY!,
    baseURL: "https://api.openai.com/v1",
  });

  const PROMPT = `A clean, minimalistic black-and-white line drawing icon in vector style, representing the concept of '${userinput}'. The illustration should be simple, elegant, and symbolic — suitable for use as an app icon or logo. Use only fine black lines on a white background. No shading, no color, no extra elements unrelated to the concept. Centered and clearly recognizable.`;

  try {
    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: PROMPT,
      n: 1,
      size: "1024x1024",
    });

    return response.data;
  } catch (err) {
    console.error("Error while generating image from OpenAI:", err);
    throw new Error("Failed to generate image");
  }
};

export const imageUrlProxyHandler = async (req: Request, res: Response) => {
  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).send("Missing url parameter");
  }

  try {
    const response = await fetch(imageUrl as string);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.set(
      "Content-Type",
      response.headers.get("Content-Type") || "image/png"
    );
    res.set("Access-Control-Allow-Origin", "*");
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to fetch image");
  }
};
