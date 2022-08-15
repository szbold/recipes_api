import { RequestHandler } from "express";
import { UploadedFile } from "express-fileupload";
import sharp from "sharp";
import sizeOf from "image-size";
import { Errors } from "./errors";

export const generateImageName = (originalName: string) =>
  "images/" + new Date().toISOString() + originalName;

export const parseImage: RequestHandler = async (req, res, next) => {
  const image: UploadedFile | undefined = req.body.image;

  if (!image) {
    next(Errors.fileCount);
    return;
  }

  const dims = sizeOf(image.data);

  if (dims.width && dims.height) {
    const resizeFactor = Math.round(dims.width / 700);

    req.body.image.data = await sharp(image.data)
      .webp()
      .resize(700, Math.round(dims.height / resizeFactor))
      .toBuffer();
  } else {
    next(new Error(Errors.fileError));
  }

  next();
};
