import type { AuthActor } from "./auth";

declare global {
  namespace Express {
    interface Request {
      actor?: AuthActor;
    }
  }
}

export {};
