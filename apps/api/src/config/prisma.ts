import dns from "node:dns";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";
import { env } from "./env.js";

const log: ("error" | "warn")[] = env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

dns.setDefaultResultOrder("ipv4first");
neonConfig.webSocketConstructor = ws;

export const prisma = env.DATABASE_URL.includes("neon.tech")
  ? new PrismaClient({
      adapter: new PrismaNeon(new Pool({ connectionString: env.DATABASE_URL })),
      log
    })
  : new PrismaClient({ log });
