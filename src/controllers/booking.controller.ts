import type { Request, Response } from "express";
import * as bookingService from "../services/booking.service";
import AppError from "../utils/app-error";

const getActor = (req: Request) => {
  if (!req.actor) {
    throw new AppError("Authenticated user not found.", 401);
  }
  return req.actor;
};

export const getBookings = async (req: Request, res: Response) => {
  const actor = getActor(req);
  const userIdFilter = Array.isArray(req.query.userId) ? req.query.userId[0] : req.query.userId;
  const bookings = await bookingService.listBookings(actor, userIdFilter);
  res.json({ bookings });
};

export const createBooking = async (req: Request, res: Response) => {
  const actor = getActor(req);
  const booking = await bookingService.createBooking(actor.id, req.body);
  res.status(201).json({ booking });
};

export const removeBooking = async (req: Request, res: Response) => {
  const actor = getActor(req);
  const result = await bookingService.deleteBooking(req.params.id, actor);
  res.json({
    message: "Booking deleted.",
    ...result,
  });
};

export const getBookingSummary = async (_req: Request, res: Response) => {
  const summary = await bookingService.getBookingSummary();
  res.json(summary);
};
