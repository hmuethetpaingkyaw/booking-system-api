import type { UserRole } from "@prisma/client";
import { ROLES, VALID_ROLES } from "../constants/roles";
import AppError from "../utils/app-error";
import { toPositiveInt } from "../utils/validators";
import type { Role } from "../types/auth";
import { hash } from "bcryptjs";
import { userRepository } from "../repositories/user.repository";
import { bookingRepository } from "../repositories/booking.repository";

interface CreateUserInput {
  name?: string;
  role?: Role;
  password?: string;
}

export const listUsers = () =>
  userRepository.listPublicUsers();

export const createUser = async ({ name, role, password }: CreateUserInput) => {
  if (!name || typeof name !== "string" || !name.trim()) {
    throw new AppError("name is required.", 400);
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    throw new AppError("password is required and must be at least 6 characters.", 400);
  }

  if (role && !VALID_ROLES.has(role)) {
    throw new AppError("role must be admin, owner, or user.", 400);
  }

  const passwordHash = await hash(password, 10);

  return userRepository.createUser({
    name: name.trim(),
    passwordHash,
    role: (role || ROLES.USER) as UserRole,
  });
};

export const updateUserRole = async (userIdParam: unknown, role: unknown) => {
  const userId = toPositiveInt(userIdParam, "user id");

  if (typeof role !== "string" || !VALID_ROLES.has(role as Role)) {
    throw new AppError("role must be admin, owner, or user.", 400);
  }

  return userRepository.updateUserRole(userId, role as UserRole);
};

export const deleteUser = async (userIdParam: unknown) => {
  const userId = toPositiveInt(userIdParam, "user id");

  const existingUser = await userRepository.findIdOnlyById(userId);

  if (!existingUser) {
    throw new AppError("User not found.", 404);
  }

  const deletedBookings = await bookingRepository.countByUserId(userId);

  await userRepository.deleteUser(userId);

  return {
    deletedUserId: userId,
    deletedBookings,
  };
};
