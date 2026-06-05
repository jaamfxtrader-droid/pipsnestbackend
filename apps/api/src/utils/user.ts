import type { User } from "@prisma/client";

export function publicUser(user: User & { admin?: unknown }) {
  const { passwordHash, twoFactorSecret, admin, ...safeUser } = user;
  return safeUser;
}

export function makeReferralCode(name = "USER") {
  const prefix = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8)
    .toUpperCase()
    .padEnd(4, "X");
  return `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
}

export function makeOrderNumber() {
  return `PNF-${Date.now().toString().slice(-8)}-${Math.floor(100 + Math.random() * 900)}`;
}
