import { beforeEach, describe, expect, it, vi } from "vitest";
import AppError from "../utils/app-error";

const { bookingRepositoryMock, userRepositoryMock } = vi.hoisted(() => ({
  bookingRepositoryMock: {
    listBookings: vi.fn(),
    findFirstOverlap: vi.fn(),
    createBooking: vi.fn(),
    findBookingById: vi.fn(),
    deleteBooking: vi.fn(),
    groupCountByUser: vi.fn(),
  },
  userRepositoryMock: {
    findPublicByIds: vi.fn(),
  },
}));

vi.mock("../repositories/booking.repository", () => ({
  bookingRepository: bookingRepositoryMock,
}));

vi.mock("../repositories/user.repository", () => ({
  userRepository: userRepositoryMock,
}));

import * as bookingService from "./booking.service";

describe("booking.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listBookings restricts normal user to own bookings", async () => {
    bookingRepositoryMock.listBookings.mockResolvedValue([]);

    await bookingService.listBookings({ id: 10, name: "u", role: "user" }, 99);

    expect(bookingRepositoryMock.listBookings).toHaveBeenCalledWith({ userId: 10 });
  });

  it("listBookings applies filter for admin/owner", async () => {
    bookingRepositoryMock.listBookings.mockResolvedValue([]);

    await bookingService.listBookings({ id: 1, name: "a", role: "admin" }, "5");

    expect(bookingRepositoryMock.listBookings).toHaveBeenCalledWith({ userId: 5 });
  });

  it("createBooking rejects overlapping range", async () => {
    bookingRepositoryMock.findFirstOverlap.mockResolvedValue({ id: 1 });

    await expect(
      bookingService.createBooking(1, {
        startTime: "2026-03-15T10:00:00Z",
        endTime: "2026-03-15T11:00:00Z",
      }),
    ).rejects.toMatchObject({
      message: "Already booked time.",
      statusCode: 400,
    } satisfies Partial<AppError>);
  });

  it("createBooking persists when no overlap", async () => {
    bookingRepositoryMock.findFirstOverlap.mockResolvedValue(null);
    bookingRepositoryMock.createBooking.mockResolvedValue({ id: 22 });

    const result = await bookingService.createBooking(5, {
      startTime: "2026-03-15T10:00:00Z",
      endTime: "2026-03-15T11:00:00Z",
    });

    expect(bookingRepositoryMock.createBooking).toHaveBeenCalled();
    expect(result).toEqual({ id: 22 });
  });

  it("deleteBooking blocks normal user deleting others booking", async () => {
    bookingRepositoryMock.findBookingById.mockResolvedValue({ id: 12, userId: 77 });

    await expect(
      bookingService.deleteBooking(12, { id: 1, name: "u", role: "user" }),
    ).rejects.toMatchObject({
      message: "Users can only delete their own bookings.",
      statusCode: 403,
    } satisfies Partial<AppError>);
  });

  it("getBookingSummary maps grouped data to user names", async () => {
    bookingRepositoryMock.groupCountByUser.mockResolvedValue([
      { userId: 1, _count: { _all: 2 } },
      { userId: 2, _count: { _all: 1 } },
    ]);
    userRepositoryMock.findPublicByIds.mockResolvedValue([
      { id: 1, name: "admin1", role: "admin" },
      { id: 2, name: "user1", role: "user" },
    ]);

    const summary = await bookingService.getBookingSummary();

    expect(summary.totalBookings).toBe(3);
    expect(summary.totalUsersWithBookings).toBe(2);
    expect(summary.bookingsPerUser[0]).toMatchObject({
      userId: 1,
      userName: "admin1",
      totalBookings: 2,
    });
  });
});
