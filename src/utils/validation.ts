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

  if (!image || Array.isArray(image)) {
    res.status(400).send({ err: ResError.fileCount });
    return;
  }

  if (!allowedTypes.includes(image.mimetype)) {
    res.status(400).send({ err: ResError.fileFormat });
    return;
  }

  req.body.image = image;

  next();
};

export const optionalImageValidator: RequestHandler = (req, res, next) => {
  const image = req.files?.image;

  if (image && !Array.isArray(image)) {
    if (!allowedTypes.includes(image.mimetype)) {
      res.status(400).send({ err: ResError.fileFormat });
      return;
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
//     throw new Error(ResError.fileCount);
//   }
// };
