import type { NextFunction, Request, Response } from "express";
import type { Role } from "../types/auth";
import AppError from "../utils/app-error";

const authorize = (roles: Role[]) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.actor || !roles.includes(req.actor.role)) {
    return next(new AppError("You do not have permission for this action.", 403));
  }
  return next();
};

export default authorize;
