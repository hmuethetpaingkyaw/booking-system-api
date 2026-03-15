import jwt from "jsonwebtoken";
import AppError from "../utils/app-error";
import { compare } from "bcryptjs";
import { userRepository } from "../repositories/user.repository";

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRES_IN = "8h";

const assertJwtSecret = () => {
  if (!JWT_SECRET) {
    throw new AppError("JWT_SECRET is not configured.", 500);
  }
};

export const loginByCredentials = async (nameRaw: unknown, passwordRaw: unknown) => {
  assertJwtSecret();

  if (!nameRaw || typeof nameRaw !== "string" || !nameRaw.trim()) {
    throw new AppError("name is required.", 400);
  }
  if (!passwordRaw || typeof passwordRaw !== "string") {
    throw new AppError("password is required.", 400);
  }

  const user = await userRepository.findAuthByName(nameRaw.trim());

  if (!user?.passwordHash) {
    throw new AppError("Invalid name or password.", 401);
  }

  const isPasswordValid = await compare(passwordRaw, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError("Invalid name or password.", 401);
  }

  const token = jwt.sign(
    {
      userId: user.id,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET as string,
    { expiresIn: TOKEN_EXPIRES_IN },
  );

  return {
    token,
    user: { id: user.id, name: user.name, role: user.role },
  };
};
