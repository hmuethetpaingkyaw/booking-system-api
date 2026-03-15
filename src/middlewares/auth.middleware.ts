import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { VALID_ROLES } from "../constants/roles";
import type { Role } from "../types/auth";
import AppError from "../utils/app-error";
import { userRepository } from "../repositories/user.repository";

interface AccessTokenPayload extends JwtPayload {
  userId?: number;
  name?: string;
  role?: Role;
}

const JWT_SECRET = process.env.JWT_SECRET;

const extractBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader) {
    throw new AppError("Missing Authorization header.", 401);
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new AppError("Authorization must be a Bearer token.", 401);
  }

  return token;
};

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  if (!JWT_SECRET) {
    return next(new AppError("JWT_SECRET is not configured.", 500));
  }

  let decoded: AccessTokenPayload;
  try {
    const token = extractBearerToken(req.header("authorization"));
    decoded = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError("Invalid or expired token.", 401));
  }

  const tokenUserId = Number(decoded.userId);
  const tokenRole = decoded.role;

  if (!Number.isInteger(tokenUserId) || tokenUserId <= 0) {
    return next(new AppError("Invalid token payload: userId is required.", 401));
  }

  if (!tokenRole || !VALID_ROLES.has(tokenRole)) {
    return next(new AppError("Invalid token payload: role is invalid.", 401));
  }

  const actor = await userRepository.findPublicById(tokenUserId);

  if (!actor) {
    return next(new AppError("Authenticated user not found.", 401));
  }

  // Reject stale tokens if user role changed after token issuance.
  if (actor.role !== tokenRole) {
    return next(new AppError("Token role no longer valid. Please sign in again.", 401));
  }

  req.actor = actor;
  return next();
};
