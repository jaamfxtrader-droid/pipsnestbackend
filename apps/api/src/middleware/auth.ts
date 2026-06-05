import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/http.js";
import { verifyToken } from "../utils/jwt.js";

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) throw new HttpError(401, "Authentication token is required");

    const payload = verifyToken(token);
    if (payload.purpose === "2fa") throw new HttpError(401, "Complete two-factor authentication first");
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, role: true, status: true, emailVerified: true, isActive: true, blockedUntil: true }
    });

    if (!user) throw new HttpError(401, "User is not active");

    if (!user.isActive) {
      if (user.blockedUntil && user.blockedUntil <= new Date()) {
        const reactivatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            isActive: true,
            blockedAt: null,
            blockedUntil: null,
            blockReason: null,
            blockedById: null
          },
          select: { id: true, email: true, role: true }
        });
        req.user = { id: reactivatedUser.id, email: reactivatedUser.email, role: reactivatedUser.role };
        return next();
      }

      throw new HttpError(401, "User is blocked");
    }

    if (user.role === "TRADER" && (!user.emailVerified || user.status === "PENDING")) {
      throw new HttpError(403, "Please verify your email before continuing.");
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, "Invalid or expired token"));
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, "Authentication required"));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, "Insufficient permissions"));
    return next();
  };
}
