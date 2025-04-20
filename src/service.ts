import type { Context } from "hono";
import { processImageFromUrl } from "../src/utils.js";
import OpenAI from "openai";

export const generateSvgService = async (c: Context) => {
  const { userinput } = await c.req.json();

  try {
    const result = await generateAIImage(userinput);

    const images = await Promise.all(
      result.map(async (image) => {
        const svg = await processImageFromUrl(image.url!, {
          //   pathomit: 0,
          //   roundcoords: 2,
          //   ltres: 0.5,
          //   qtres: 0.5,
          //   numberofcolors: 64,
          // }
          qtres: 0.01,
          linefilter: false,
        }).then((svgData) => {
          // const sanitizedSVG = sanitizeSVG(svgData as string);
          // console.log("sanitizedSVG => ", sanitizedSVG);
          // return sanitizedSVG;
          return svgData;
        });

        return { ...image, svg };
      })
    );

    // console.log("images ==> ", images );

    return c.json({
      data: { images },
      success: true,
      message: "Generated icon successfully",
    });
  } catch (err) {
    console.error("error: ", err);
    return c.json({
      success: false,
      message: "Something went wrong",
      error: err,
    });
  }

  return c.json({ message: userinput });
};

export const generateAIImage = async (userinput: string) => {
  const openai = new OpenAI({
    apiKey: process.env.IMAGE_AI_KEY!,
    baseURL: "https://api.openai.com/v1",
  });

  const PROMPT = `A clean, minimalistic black-and-white line drawing icon in vector style, representing the concept of '${userinput}'. The illustration should be simple, elegant, and symbolic — suitable for use as an app icon or logo. Use only fine black lines on a white background. No shading, no color, no extra elements unrelated to the concept. Centered and clearly recognizable.`;
  try {
    if (!process.env.IMAGE_AI_KEY) {
      throw Error("Open ai key not found");
    }

    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: PROMPT,
      n: 2,
      size: "1024x1024",
    });

    return response.data;
  } catch (err) {
    console.error("error while generating image from ai => ", err);
    throw new Error("Something went wrong");
  }
};
