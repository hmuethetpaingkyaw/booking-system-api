import { Router } from "express";
import asyncHandler from "../middlewares/async-handler";
import authorize from "../middlewares/authorize.middleware";
import { ROLES } from "../constants/roles";
import * as userController from "../controllers/user.controller";

const router = Router();

router.use(authorize([ROLES.ADMIN]));

router.get("/", asyncHandler(userController.getUsers));
router.post("/", asyncHandler(userController.createUser));
router.patch("/:id/role", asyncHandler(userController.updateRole));
router.delete("/:id", asyncHandler(userController.removeUser));

export default router;
