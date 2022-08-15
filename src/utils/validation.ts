import { RequestHandler } from "express";
import { UploadedFile } from "express-fileupload";
import { Errors } from "./errors";

const allowedTypes = [
  "image/png",
  "image/jpg",
  "image/jpeg",
  "image/bmp",
  "image/webp",
];

export const imageValidator: RequestHandler = (req, _, next) => {
  const image = req.files?.image;

  if (!image || Array.isArray(image)) {
    return next(Errors.fileCount);
  }

  if (!allowedTypes.includes(image.mimetype)) {
    return next(Errors.fileFormat);
  }

  req.body.image = image;

  next();
};

export const optionalImageValidator: RequestHandler = (req, _, next) => {
  const image = req.files?.image;

  if (image && !Array.isArray(image)) {
    if (!allowedTypes.includes(image.mimetype)) {
      return next(Errors.fileFormat);
    }

    req.body.image = image;
  }

  next();
};
// TODO - make this work with the above validator

// const fileFormatValidator = (file: UploadedFile) => {
//   return file.mimetype in allowedTypes;
// };

// const fileCountValidator = (
//   file: UploadedFile | UploadedFile[] | undefined
// ) => {
//   if (!file || Array.isArray(file)) {
//     throw new Error(Errors.fileCount);
//   }
// };
