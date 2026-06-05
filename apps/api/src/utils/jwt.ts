import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../config/env.js";

export type JwtUser = {
  id: string;
  email: string;
  role: Role;
  purpose?: "auth" | "2fa";
};

export function signToken(user: JwtUser, expiresIn: SignOptions["expiresIn"] = "7d") {
  return jwt.sign({ ...user, purpose: user.purpose ?? "auth" }, env.JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as JwtUser;
}
