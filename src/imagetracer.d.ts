declare module "imagetracerjs" {
  interface ImageData {
    width: number;
    height: number;
    data: Uint8ClampedArray;
  }

  interface ImageTracerOptions {
    [key: string]: any;
  }

  const ImageTracer: {
    imagedataToSVG: (
      imageData: ImageData,
      options?: ImageTracerOptions
    ) => string;
  };
  export = ImageTracer;
}
