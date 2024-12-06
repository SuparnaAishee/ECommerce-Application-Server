import { NextFunction, Request, Response } from "express";

const parseRequest = (req: Request, res: Response, next: NextFunction) => {
  req.body = JSON.parse(req.body.data);
  next();
};

export default parseRequest;
