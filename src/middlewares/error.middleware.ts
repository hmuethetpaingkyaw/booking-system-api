import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

interface MaybeError {
  statusCode?: number;
  message?: string;
}

const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Resource not found." });
    }
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Duplicate value violates unique constraint." });
    }
  }

  const appError = error as MaybeError;
  const statusCode = appError.statusCode || 500;
  const message = appError.message || "Internal server error.";

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({ message });
};

export default errorHandler;
