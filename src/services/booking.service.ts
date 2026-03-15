import { ROLES } from "../constants/roles";
import AppError from "../utils/app-error";
import { parseBookingDates, toPositiveInt } from "../utils/validators";
import type { AuthActor } from "../types/auth";
import { bookingRepository } from "../repositories/booking.repository";
import { userRepository } from "../repositories/user.repository";

interface CreateBookingInput {
  startTime?: string;
  endTime?: string;
}

export const listBookings = (actor: AuthActor, userIdFilter?: unknown) => {
  let where: { userId: number } | undefined;

  if (actor.role === ROLES.USER) {
    where = { userId: actor.id };
  } else if (userIdFilter !== undefined) {
    where = { userId: toPositiveInt(userIdFilter, "user id filter") };
  }

  return bookingRepository.listBookings(where);
};

export const createBooking = (actorId: number, { startTime, endTime }: CreateBookingInput) => {
  return createBookingWithOverlapCheck(actorId, { startTime, endTime });
};

const createBookingWithOverlapCheck = async (
  actorId: number,
  { startTime, endTime }: CreateBookingInput,
) => {
  const { parsedStartTime, parsedEndTime } = parseBookingDates(startTime, endTime);

  // Overlap rule uses half-open interval logic: [startTime, endTime)
  // This means back-to-back bookings are allowed when existing.endTime === new.startTime
  // or existing.startTime === new.endTime.
  const conflictingBooking = await bookingRepository.findFirstOverlap(
    parsedStartTime,
    parsedEndTime,
  );

  if (conflictingBooking) {
    throw new AppError("Already booked time.", 400);
  }

  return bookingRepository.createBooking({
    userId: actorId,
    startTime: parsedStartTime,
    endTime: parsedEndTime,
  });
};

export const deleteBooking = async (bookingIdParam: unknown, actor: AuthActor) => {
  const bookingId = toPositiveInt(bookingIdParam, "booking id");

  const booking = await bookingRepository.findBookingById(bookingId);

  if (!booking) {
    throw new AppError("Booking not found.", 404);
  }

  const isRegularUser = actor.role === ROLES.USER;
  const isOwnerOfBooking = booking.userId === actor.id;
  if (isRegularUser && !isOwnerOfBooking) {
    throw new AppError("Users can only delete their own bookings.", 403);
  }

  await bookingRepository.deleteBooking(bookingId);

  return { deletedBookingId: bookingId };
};

export const getBookingSummary = async () => {
  const grouped = await bookingRepository.groupCountByUser();

  const userIds = grouped.map((row) => row.userId);
  const users = await userRepository.findPublicByIds(userIds);

  const usersById = new Map(users.map((user) => [user.id, user]));

  const bookingsPerUser = grouped.map((row) => {
    const user = usersById.get(row.userId);
    return {
      userId: row.userId,
      userName: user?.name || null,
      userRole: user?.role || null,
      totalBookings: row._count._all,
    };
  });

  const totalBookings = bookingsPerUser.reduce((sum, row) => sum + row.totalBookings, 0);

  return {
    totalBookings,
    totalUsersWithBookings: bookingsPerUser.length,
    bookingsPerUser,
  };
};
