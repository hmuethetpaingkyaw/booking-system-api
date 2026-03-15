import type { Request, Response } from "express";
import * as userService from "../services/user.service";
import AppError from "../utils/app-error";

export const getUsers = async (_req: Request, res: Response) => {
  const users = await userService.listUsers();
  res.json({ users });
};

export const createUser = async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  res.status(201).json({ user });
};

export const updateRole = async (req: Request, res: Response) => {
  const user = await userService.updateUserRole(req.params.id, req.body?.role);
  res.json({ user });
};

export const removeUser = async (req: Request, res: Response) => {
  const result = await userService.deleteUser(req.params.id);
  res.json({
    message: "User deleted. All of their bookings were deleted by cascade.",
    ...result,
  });
};

export const requireActor = (req: Request) => {
  if (!req.actor) {
    throw new AppError("Authenticated user not found.", 401);
  }
  return req.actor;
};
