import { RequestHandler } from "express";

export const logger: RequestHandler = (req, _, next) => {
  console.info(req.method, req.path);
  next();
};
