import type { NextFunction, Request, Response } from "express";

const notFound = (_req: Request, _res: Response, next: NextFunction) => {
  next({
    message: "Not Found",
    statusCode: 404,
  });
};

export default notFound;
