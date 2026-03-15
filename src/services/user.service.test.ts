import { beforeEach, describe, expect, it, vi } from "vitest";
import AppError from "../utils/app-error";

const { userRepositoryMock, bookingRepositoryMock, hashMock } = vi.hoisted(() => ({
  userRepositoryMock: {
    listPublicUsers: vi.fn(),
    createUser: vi.fn(),
    updateUserRole: vi.fn(),
    findIdOnlyById: vi.fn(),
    deleteUser: vi.fn(),
  },
  bookingRepositoryMock: {
    countByUserId: vi.fn(),
  },
  hashMock: vi.fn(),
}));

vi.mock("../repositories/user.repository", () => ({
  userRepository: userRepositoryMock,
}));

vi.mock("../repositories/booking.repository", () => ({
  bookingRepository: bookingRepositoryMock,
}));

vi.mock("bcryptjs", () => ({
  hash: hashMock,
}));

import * as userService from "./user.service";

describe("user.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createUser requires valid name and password", async () => {
    await expect(userService.createUser({ name: "", password: "abc123" })).rejects.toMatchObject({
      message: "name is required.",
      statusCode: 400,
    } satisfies Partial<AppError>);

    await expect(userService.createUser({ name: "john", password: "123" })).rejects.toMatchObject({
      message: "password is required and must be at least 6 characters.",
      statusCode: 400,
    } satisfies Partial<AppError>);
  });

  it("createUser hashes password and persists user", async () => {
    hashMock.mockResolvedValue("hashed-pass");
    userRepositoryMock.createUser.mockResolvedValue({ id: 1, name: "john", role: "user" });

    const created = await userService.createUser({
      name: "john",
      password: "john123",
    });

    expect(hashMock).toHaveBeenCalledWith("john123", 10);
    expect(userRepositoryMock.createUser).toHaveBeenCalledWith({
      name: "john",
      passwordHash: "hashed-pass",
      role: "user",
    });
    expect(created).toEqual({ id: 1, name: "john", role: "user" });
  });

  it("updateUserRole rejects invalid role", async () => {
    await expect(userService.updateUserRole(1, "superadmin")).rejects.toMatchObject({
      message: "role must be admin, owner, or user.",
      statusCode: 400,
    } satisfies Partial<AppError>);
  });

  it("deleteUser returns 404 when user missing", async () => {
    userRepositoryMock.findIdOnlyById.mockResolvedValue(null);

    await expect(userService.deleteUser(10)).rejects.toMatchObject({
      message: "User not found.",
      statusCode: 404,
    } satisfies Partial<AppError>);
  });

  it("deleteUser includes deleted booking count", async () => {
    userRepositoryMock.findIdOnlyById.mockResolvedValue({ id: 2 });
    bookingRepositoryMock.countByUserId.mockResolvedValue(4);
    userRepositoryMock.deleteUser.mockResolvedValue({});

    const result = await userService.deleteUser(2);

    expect(result).toEqual({
      deletedUserId: 2,
      deletedBookings: 4,
    });
    expect(userRepositoryMock.deleteUser).toHaveBeenCalledWith(2);
  });
});
