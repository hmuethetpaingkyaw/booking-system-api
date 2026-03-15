import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction, Express } from "express";

const authServiceMock = {
  loginByCredentials: vi.fn(),
};

const userServiceMock = {
  listUsers: vi.fn(),
  createUser: vi.fn(),
  updateUserRole: vi.fn(),
  deleteUser: vi.fn(),
};

const bookingServiceMock = {
  listBookings: vi.fn(),
  createBooking: vi.fn(),
  deleteBooking: vi.fn(),
  getBookingSummary: vi.fn(),
};

vi.mock("../services/auth.service", () => authServiceMock);
vi.mock("../services/user.service", () => userServiceMock);
vi.mock("../services/booking.service", () => bookingServiceMock);

vi.mock("../middlewares/auth.middleware", () => ({
  authenticate: async (req: Request, _res: Response, next: NextFunction) => {
    const roleHeader = req.header("x-test-role");
    const userIdHeader = req.header("x-test-user-id");
    const role = roleHeader === "admin" || roleHeader === "owner" ? roleHeader : "user";
    const id = Number(userIdHeader) || 1;

    req.actor = {
      id,
      name: `tester-${id}`,
      role,
    };

    next();
  },
}));

describe("Backend API routes", () => {
  let app: Express;

  beforeAll(async () => {
    app = (await import("../app")).default;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/health returns status ok", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("POST /api/auth/login authenticates by credentials", async () => {
    authServiceMock.loginByCredentials.mockResolvedValue({
      token: "mock-token",
      user: { id: 1, name: "admin1", role: "admin" },
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({ name: "admin1", password: "admin123" });

    expect(response.status).toBe(200);
    expect(response.body.token).toBe("mock-token");
    expect(authServiceMock.loginByCredentials).toHaveBeenCalledWith("admin1", "admin123");
  });

  it("GET /api/users denies non-admin user", async () => {
    const response = await request(app).get("/api/users").set("x-test-role", "user");

    expect(response.status).toBe(403);
    expect(userServiceMock.listUsers).not.toHaveBeenCalled();
  });

  it("GET /api/users allows admin user", async () => {
    userServiceMock.listUsers.mockResolvedValue([{ id: 1, name: "admin1", role: "admin" }]);

    const response = await request(app).get("/api/users").set("x-test-role", "admin");

    expect(response.status).toBe(200);
    expect(response.body.users).toHaveLength(1);
    expect(userServiceMock.listUsers).toHaveBeenCalled();
  });

  it("GET /api/bookings passes user filter to service", async () => {
    bookingServiceMock.listBookings.mockResolvedValue([]);

    const response = await request(app)
      .get("/api/bookings?userId=5")
      .set("x-test-role", "owner")
      .set("x-test-user-id", "2");

    expect(response.status).toBe(200);
    expect(bookingServiceMock.listBookings).toHaveBeenCalledWith(
      { id: 2, name: "tester-2", role: "owner" },
      "5",
    );
  });

  it("GET /api/bookings/summary denies normal user", async () => {
    const response = await request(app).get("/api/bookings/summary").set("x-test-role", "user");

    expect(response.status).toBe(403);
    expect(bookingServiceMock.getBookingSummary).not.toHaveBeenCalled();
  });

  it("GET /api/bookings/summary allows owner", async () => {
    bookingServiceMock.getBookingSummary.mockResolvedValue({
      totalBookings: 3,
      totalUsersWithBookings: 2,
      bookingsPerUser: [],
    });

    const response = await request(app).get("/api/bookings/summary").set("x-test-role", "owner");

    expect(response.status).toBe(200);
    expect(response.body.totalBookings).toBe(3);
    expect(bookingServiceMock.getBookingSummary).toHaveBeenCalled();
  });
});
