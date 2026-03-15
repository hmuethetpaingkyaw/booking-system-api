import type { UserRole } from "@prisma/client";
import prisma from "../lib/prisma";

const publicUserSelect = {
  id: true,
  name: true,
  role: true,
};

const authUserSelect = {
  id: true,
  name: true,
  role: true,
  passwordHash: true,
};

export const userRepository = {
  listPublicUsers: () =>
    prisma.user.findMany({
      select: publicUserSelect,
      orderBy: { id: "asc" },
    }),

  findPublicById: (id: number) =>
    prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    }),

  findAuthByName: (name: string) =>
    prisma.user.findUnique({
      where: { name },
      select: authUserSelect,
    }),

  findIdOnlyById: (id: number) =>
    prisma.user.findUnique({
      where: { id },
      select: { id: true },
    }),

  findPublicByIds: (ids: number[]) =>
    prisma.user.findMany({
      where: { id: { in: ids } },
      select: publicUserSelect,
    }),

  createUser: (data: { name: string; passwordHash: string; role: UserRole }) =>
    prisma.user.create({
      data,
      select: publicUserSelect,
    }),

  updateUserRole: (id: number, role: UserRole) =>
    prisma.user.update({
      where: { id },
      data: { role },
      select: publicUserSelect,
    }),

  deleteUser: (id: number) =>
    prisma.user.delete({
      where: { id },
    }),
};
