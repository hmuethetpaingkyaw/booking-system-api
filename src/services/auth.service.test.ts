import { beforeEach, describe, expect, it, vi } from "vitest";
import AppError from "../utils/app-error";

const { userRepositoryMock, compareMock, signMock } = vi.hoisted(() => ({
  userRepositoryMock: {
    findAuthByName: vi.fn(),
  },
  compareMock: vi.fn(),
  signMock: vi.fn(),
}));

vi.mock("../repositories/user.repository", () => ({
  userRepository: userRepositoryMock,
}));

vi.mock("bcryptjs", () => ({
  compare: compareMock,
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: signMock,
  },
}));

const loadService = async (secret?: string) => {
  vi.resetModules();
  if (secret) {
    vi.stubEnv("JWT_SECRET", secret);
  } else {
    vi.unstubAllEnvs();
  }
  return import("./auth.service");
};

describe("auth.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires name and password", async () => {
    const authService = await loadService("test-secret");

    await expect(authService.loginByCredentials("", "abc123")).rejects.toMatchObject({
      message: "name is required.",
      statusCode: 400,
    } satisfies Partial<AppError>);

    await expect(authService.loginByCredentials("john", "")).rejects.toMatchObject({
      message: "password is required.",
      statusCode: 400,
    } satisfies Partial<AppError>);
  });

  it("rejects invalid credentials", async () => {
    const authService = await loadService("test-secret");
    userRepositoryMock.findAuthByName.mockResolvedValue({
      id: 1,
      name: "john",
      role: "user",
      passwordHash: "hashed",
    });
    compareMock.mockResolvedValue(false);

    await expect(authService.loginByCredentials("john", "wrong")).rejects.toMatchObject({
      message: "Invalid name or password.",
      statusCode: 401,
    } satisfies Partial<AppError>);
  });

  it("returns token and user for valid credentials", async () => {
    const authService = await loadService("test-secret");
    userRepositoryMock.findAuthByName.mockResolvedValue({
      id: 2,
      name: "admin1",
      role: "admin",
      passwordHash: "hashed-pass",
    });
    compareMock.mockResolvedValue(true);
    signMock.mockReturnValue("jwt-token");

    const result = await authService.loginByCredentials("admin1", "admin123");

    expect(signMock).toHaveBeenCalled();
    expect(result).toEqual({
      token: "jwt-token",
      user: { id: 2, name: "admin1", role: "admin" },
    });
  });
});
