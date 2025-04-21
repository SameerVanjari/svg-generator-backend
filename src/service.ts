import { type Request, type Response } from "express";
import { processImageFromUrl } from "../src/utils";
import OpenAI from "openai";

export const generateSvgHandler = async (req: Request, res: Response) => {
  const { userinput } = req.body;

  try {
    const result = await generateAIImage(userinput);

    const images = await Promise.all(
      result.map(async (image) => {
        const svg = await processImageFromUrl(image.url!, {
          qtres: 0.01,
          linefilter: false,
        });
        return { ...image, svg };
      })
    );

    return res.json({
      data: { images },
      success: true,
      message: "Generated icon successfully",
    });
  } catch (err) {
    console.error("error: ", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err instanceof Error ? err.message : err,
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
