import type { Types } from "mongoose";

export interface AuthUser {
  _id: Types.ObjectId;
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser | null;
      userId?: string;
    }
  }
}

export {};
