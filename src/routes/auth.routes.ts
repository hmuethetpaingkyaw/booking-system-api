import { Router } from "express";
import asyncHandler from "../middlewares/async-handler";
import * as authController from "../controllers/auth.controller";

const router = Router();

router.post("/login", asyncHandler(authController.login));

export default router;
