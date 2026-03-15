import type { Request, Response } from "express";
import * as authService from "../services/auth.service";

export const login = async (req: Request, res: Response) => {
  const result = await authService.loginByCredentials(req.body?.name, req.body?.password);
  res.json(result);
};
