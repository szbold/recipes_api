import { RequestHandler } from "express";
import { UploadedFile } from "express-fileupload";
import sharp from "sharp";
import sizeOf from "image-size";
import { ResError } from "../errors";

export const generateImageName = (originalName: string) =>
  "images/" + new Date().toISOString() + originalName;

export const parseImage: RequestHandler = async (req, res, next) => {
  const image: UploadedFile | undefined = req.body.image;

  if (!image) {
    next();
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
    res.status(500).send({ err: ResError.fileError });
  }

  next();
};
