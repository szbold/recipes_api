import { ErrorRequestHandler } from "express";

export enum Errors {
  notFound = "NOT_FOUND",
  fileFormat = "INVALID_FILE_FORMAT",
  fileCount = "INVALID_FILE_COUNT",
  s3Error = "S3_ERROR",
  serverError = "SERVER_ERROR",
  dbError = "DATABASE_ERROR",
  fileError = "FILE_POSSIBLY_CORRUPTED",
  invalidData = "INVALID_OR_MISSING_DATA",
}

const createError = (err: Errors, path: string, method: string) => {
  return {
    err,
    path,
    method,
    timestamp: new Date().getTime(),
  };
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (!err) {
    return next();
  }

  const errorResponse = createError(err, req.path, req.method);

  switch (err) {
    case Errors.notFound:
      res.status(404).send(errorResponse);
      break;
    case Errors.fileFormat:
      res.status(400).send(errorResponse);
      break;
    case Errors.fileCount:
      res.status(400).send(errorResponse);
      break;
    case Errors.fileError:
      res.status(400).send(errorResponse);
      break;
    default:
      res.status(500).send(errorResponse);
      break;
  }
};
