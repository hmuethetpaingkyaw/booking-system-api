export type Role = "admin" | "owner" | "user";

export interface AuthActor {
  id: number;
  name: string;
  role: Role;
}
