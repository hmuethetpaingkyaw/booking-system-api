import { Router } from "express";
import asyncHandler from "../middlewares/async-handler";
import { authenticate } from "../middlewares/auth.middleware";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import bookingRoutes from "./booking.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use(asyncHandler(authenticate));
router.use("/users", userRoutes);
router.use("/bookings", bookingRoutes);

export default router;
