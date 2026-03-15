import type { Role } from "../types/auth";

export const ROLES = {
  ADMIN: "admin",
  OWNER: "owner",
  USER: "user",
} as const;

export const VALID_ROLES = new Set<Role>(Object.values(ROLES));
