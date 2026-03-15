import prisma from "../lib/prisma";

const bookingWithUserInclude = {
  user: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
};

export const bookingRepository = {
  listBookings: (where?: { userId: number }) =>
    prisma.booking.findMany({
      where,
      include: bookingWithUserInclude,
      orderBy: { startTime: "asc" },
    }),

  findFirstOverlap: (startTime: Date, endTime: Date) =>
    prisma.booking.findFirst({
      where: {
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        userId: true,
        startTime: true,
        endTime: true,
      },
    }),

  createBooking: (data: { userId: number; startTime: Date; endTime: Date }) =>
    prisma.booking.create({
      data,
      include: bookingWithUserInclude,
    }),

  findBookingById: (id: number) =>
    prisma.booking.findUnique({
      where: { id },
      select: { id: true, userId: true },
    }),

  deleteBooking: (id: number) =>
    prisma.booking.delete({
      where: { id },
    }),

  countByUserId: (userId: number) =>
    prisma.booking.count({
      where: { userId },
    }),

  groupCountByUser: () =>
    prisma.booking.groupBy({
      by: ["userId"],
      _count: { _all: true },
      orderBy: { userId: "asc" },
    }),
};
