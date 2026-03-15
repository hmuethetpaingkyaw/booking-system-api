import { Router } from "express";
import asyncHandler from "../middlewares/async-handler";
import authorize from "../middlewares/authorize.middleware";
import { ROLES } from "../constants/roles";
import * as bookingController from "../controllers/booking.controller";

const router = Router();

router.get("/", asyncHandler(bookingController.getBookings));
router.post("/", asyncHandler(bookingController.createBooking));
router.delete("/:id", asyncHandler(bookingController.removeBooking));
router.get(
  "/summary",
  authorize([ROLES.OWNER, ROLES.ADMIN]),
  asyncHandler(bookingController.getBookingSummary),
);

export default router;
