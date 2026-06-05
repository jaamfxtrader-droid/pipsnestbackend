import path from "node:path";
import { config } from "dotenv";
import { z } from "zod";

config();
config({ path: path.resolve(process.cwd(), "../../.env"), override: false });
config({ path: path.resolve(process.cwd(), ".env"), override: false });

if (!process.env.DATABASE_URL && process.env.DB_URL) {
  process.env.DATABASE_URL = process.env.DB_URL;
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z.string().min(24, "JWT_SECRET must be at least 24 characters"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  CORS_ORIGINS: z.string().optional(),
  PAYMENT_SECRET_KEY: z.string().optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
  NOWPAYMENTS_API_KEY: z.string().optional(),
  NOWPAYMENTS_IPN_SECRET: z.string().optional(),
  NOWPAYMENTS_IPN_CALLBACK_URL: z.string().url().optional(),
  NOWPAYMENTS_PAY_CURRENCY: z.string().default("usdttrc20"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_SECURE: z.enum(["true", "false"]).default("true").transform((value) => value === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  MT5_SERVER: z.string().optional(),
  MT5_MANAGER_LOGIN: z.string().optional(),
  MT5_MANAGER_PASSWORD: z.string().optional(),
  MT4_SERVER: z.string().optional(),
  MT4_MANAGER_LOGIN: z.string().optional(),
  MT4_MANAGER_PASSWORD: z.string().optional()
});

export const env = envSchema.parse(process.env);
