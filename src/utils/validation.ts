import { RequestHandler } from "express";
import { UploadedFile } from "express-fileupload";
import { ResError } from "../errors";

const allowedTypes = [
  "image/png",
  "image/jpg",
  "image/jpeg",
  "image/bmp",
  "image/webp",
];

export const imageValidator: RequestHandler = (req, res, next) => {
  const image = req.files?.image;

  fileCountValidator(image);
  fileFormatValidator(image);

  req.body.image = image;

  next();
};

const fileFormatValidator = (file: UploadedFile) => {
  if (!(file.mimetype in allowedTypes)) {
    throw new Error(ResError.fileFormat);
  }
};

const fileCountValidator = (
  file: UploadedFile | UploadedFile[] | undefined
) => {
  if (!file || Array.isArray(file)) {
    throw new Error(ResError.fileCount);
  }
};
