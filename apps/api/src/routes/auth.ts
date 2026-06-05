import { Router, type Request } from "express";
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { z } from "zod";
import {
  forgotPasswordSchema,
  loginSchema,
  profileSettingsSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema
} from "@pipnest/shared";
import { prisma } from "../config/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { uploadAvatarImage } from "../services/cloudinary.service.js";
import { sendEmail } from "../services/email.service.js";
import { decryptTotpSecret, encryptTotpSecret, generateTotpSecret, makeOtpAuthUrl, verifyTotpCode } from "../services/totp.service.js";
import { HttpError, asyncHandler, sendSuccess } from "../utils/http.js";
import { signToken, verifyToken } from "../utils/jwt.js";
import { makeReferralCode, publicUser } from "../utils/user.js";

export const authRouter = Router();

const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional()
});

const twoFactorLoginSchema = z.object({
  twoFactorToken: z.string().min(20),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit authenticator code"),
  deviceId: z.string().trim().min(8).max(120).optional()
});

const twoFactorCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit authenticator code")
});

const identityAvailabilitySchema = z.object({
  username: z.string().trim().optional(),
  phone: z.string().trim().optional()
});

const OTP_TTL_MINUTES = 10;
const TWO_FACTOR_TRUST_DAYS = 2;
const TWO_FACTOR_TRUST_MS = TWO_FACTOR_TRUST_DAYS * 24 * 60 * 60 * 1000;

function normalizePhone(phone: string) {
  const compact = phone.replace(/[\s().-]/g, "");
  return compact.startsWith("+") ? `+${compact.slice(1).replace(/\+/g, "")}` : compact.replace(/\+/g, "");
}

function getClientIp(req: Request) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) return forwardedFor.split(",")[0].trim();
  if (Array.isArray(forwardedFor) && forwardedFor[0]) return forwardedFor[0].split(",")[0].trim();
  return req.ip || req.socket.remoteAddress || null;
}

function isCurrentlyBlocked(user: { isActive: boolean; blockedUntil: Date | null }) {
  return !user.isActive && (!user.blockedUntil || user.blockedUntil > new Date());
}

async function ensureUserCanAuthenticate<T extends { id: string; isActive: boolean; blockedUntil: Date | null; blockReason: string | null }>(
  user: T | null,
  invalidMessage: string
) {
  if (!user) throw new HttpError(401, invalidMessage);

  if (user.isActive) return user;

  if (user.blockedUntil && user.blockedUntil <= new Date()) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        blockedAt: null,
        blockedUntil: null,
        blockReason: null,
        blockedById: null
      }
    });
    return { ...user, isActive: true, blockedAt: null, blockedUntil: null, blockReason: null, blockedById: null };
  }

  const until = user.blockedUntil ? ` until ${user.blockedUntil.toISOString()}` : "";
  throw new HttpError(403, `This account is blocked${until}. Please contact support.`);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeDeviceId(deviceId: unknown) {
  return typeof deviceId === "string" ? deviceId.trim().slice(0, 120) : "";
}

async function isTrustedTwoFactorDevice(userId: string, deviceId: unknown) {
  const normalizedDeviceId = normalizeDeviceId(deviceId);
  if (!normalizedDeviceId) return false;

  const trustedDevice = await prisma.twoFactorTrustedDevice.findUnique({
    where: { userId_deviceId: { userId, deviceId: normalizedDeviceId } }
  });
  if (!trustedDevice) return false;

  if (trustedDevice.expiresAt <= new Date()) {
    await prisma.twoFactorTrustedDevice.delete({ where: { id: trustedDevice.id } }).catch(() => undefined);
    return false;
  }

  await prisma.twoFactorTrustedDevice.update({
    where: { id: trustedDevice.id },
    data: { lastUsedAt: new Date() }
  });
  return true;
}

async function trustTwoFactorDevice(userId: string, deviceId: unknown) {
  const normalizedDeviceId = normalizeDeviceId(deviceId);
  if (!normalizedDeviceId) return;

  const expiresAt = new Date(Date.now() + TWO_FACTOR_TRUST_MS);
  await prisma.twoFactorTrustedDevice.upsert({
    where: { userId_deviceId: { userId, deviceId: normalizedDeviceId } },
    update: { expiresAt, lastUsedAt: new Date() },
    create: { userId, deviceId: normalizedDeviceId, expiresAt }
  });
}

function generateOtp(length: number) {
  return Array.from({ length }, () => randomInt(0, 10)).join("");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function otpTemplate({
  title,
  name,
  code,
  intro
}: {
  title: string;
  name: string;
  code: string;
  intro: string;
}) {
  const safeName = escapeHtml(name || "Trader");
  const safeIntro = escapeHtml(intro);
  const safeCode = escapeHtml(code);
  const html = `
    <div style="margin:0;padding:32px;background:#f4f8ff;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dbe7ff;border-radius:18px;overflow:hidden;box-shadow:0 24px 70px rgba(37,99,235,0.14);">
        <div style="padding:28px 30px;background:#061126;color:#ffffff;">
          <div style="font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#93c5fd;">PipNest Markets</div>
          <h1 style="margin:14px 0 0;font-size:26px;line-height:1.25;">${escapeHtml(title)}</h1>
        </div>
        <div style="padding:30px;">
          <p style="margin:0 0 14px;font-size:16px;line-height:1.7;">Hi ${safeName},</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#475569;">${safeIntro}</p>
          <div style="margin:0 0 24px;padding:18px;border-radius:14px;background:#eef5ff;text-align:center;border:1px solid #bfdbfe;">
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#2563eb;">Your OTP</div>
            <div style="margin-top:8px;font-size:36px;font-weight:800;letter-spacing:10px;color:#0f172a;">${safeCode}</div>
          </div>
          <p style="margin:0;font-size:14px;line-height:1.7;color:#64748b;">This code expires in ${OTP_TTL_MINUTES} minutes. If you did not request it, you can ignore this email.</p>
        </div>
      </div>
    </div>
  `;
  const text = `${title}\n\nHi ${name || "Trader"},\n${intro}\n\nYour OTP: ${code}\n\nThis code expires in ${OTP_TTL_MINUTES} minutes.`;

  return { html, text };
}

function noticeTemplate({ title, name, message }: { title: string; name: string; message: string }) {
  const html = `
    <div style="margin:0;padding:32px;background:#f4f8ff;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dbe7ff;border-radius:18px;overflow:hidden;">
        <div style="padding:28px 30px;background:#061126;color:#ffffff;">
          <div style="font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#93c5fd;">PipNest Markets</div>
          <h1 style="margin:14px 0 0;font-size:26px;line-height:1.25;">${escapeHtml(title)}</h1>
        </div>
        <div style="padding:30px;">
          <p style="margin:0 0 14px;font-size:16px;line-height:1.7;">Hi ${escapeHtml(name || "Trader")},</p>
          <p style="margin:0;font-size:15px;line-height:1.7;color:#475569;">${escapeHtml(message)}</p>
        </div>
      </div>
    </div>
  `;
  return {
    html,
    text: `${title}\n\nHi ${name || "Trader"},\n${message}`
  };
}

async function createOtp({
  user,
  purpose,
  length
}: {
  user: { id: string; name: string; email: string };
  purpose: "EMAIL_VERIFICATION" | "PASSWORD_RESET";
  length: number;
}) {
  const email = normalizeEmail(user.email);
  const code = generateOtp(length);

  await prisma.authOtp.updateMany({
    where: { email, purpose, consumedAt: null },
    data: { consumedAt: new Date() }
  });

  await prisma.authOtp.create({
    data: {
      userId: user.id,
      email,
      purpose,
      codeHash: await bcrypt.hash(code, 10),
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000)
    }
  });

  return code;
}

async function sendVerificationOtp(user: { id: string; name: string; email: string }) {
  const code = await createOtp({ user, purpose: "EMAIL_VERIFICATION", length: 6 });
  const email = otpTemplate({
    title: "Verify your email",
    name: user.name,
    code,
    intro: "Please verify your email to activate your PipNest Markets account."
  });

  const sent = await sendEmail({
    to: user.email,
    subject: "Verify your PipNest Markets email",
    ...email
  });
  return sent;
}

async function sendPasswordResetOtp(user: { id: string; name: string; email: string }) {
  const code = await createOtp({ user, purpose: "PASSWORD_RESET", length: 4 });
  const email = otpTemplate({
    title: "Reset your password",
    name: user.name,
    code,
    intro: "Use this code to confirm your password reset request."
  });

  const sent = await sendEmail({
    to: user.email,
    subject: "Your PipNest Markets password reset code",
    ...email
  });
  if (!sent) throw new HttpError(503, "Email delivery is not configured yet");
}

async function sendLoginNotice(user: { name: string; email: string }) {
  const email = noticeTemplate({
    title: "New login to your account",
    name: user.name,
    message: "Your PipNest Markets account was just accessed. If this was not you, reset your password and contact support."
  });

  await sendEmail({
    to: user.email,
    subject: "New PipNest Markets login",
    ...email
  });
}

async function sendActionOtpNotice(user: { name: string; email: string }, action: string) {
  const code = generateOtp(6);
  const email = otpTemplate({
    title: `${action} OTP`,
    name: user.name,
    code,
    intro: `Use this OTP as your PipNest Markets security reference for: ${action}.`
  });

  await sendEmail({
    to: user.email,
    subject: `Your PipNest Markets ${action} OTP`,
    ...email
  });
}

async function createLoginNotification(user: { id: string }, req: Request) {
  const ipAddress = getClientIp(req);
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "New login detected",
      message: `Your account was accessed${ipAddress ? ` from ${ipAddress}` : ""}. If this was not you, reset your password and contact support.`,
      type: "WARNING"
    }
  });
}

async function sendPasswordChangedNotice(user: { name: string; email: string }, payoutHoldUntil: Date) {
  const email = noticeTemplate({
    title: "Password changed successfully",
    name: user.name,
    message: `Your password was changed successfully. For account safety, payout requests are locked until ${payoutHoldUntil.toISOString()}.`
  });

  await sendEmail({
    to: user.email,
    subject: "Your PipNest Markets password was changed",
    ...email
  });
}

async function consumeOtp({
  email,
  purpose,
  code,
  userId
}: {
  email: string;
  purpose: "EMAIL_VERIFICATION" | "PASSWORD_RESET";
  code: string;
  userId: string;
}) {
  const normalizedEmail = normalizeEmail(email);
  const candidates = await prisma.authOtp.findMany({
    where: {
      email: normalizedEmail,
      userId,
      purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  for (const candidate of candidates) {
    const valid = await bcrypt.compare(code, candidate.codeHash);
    if (!valid) continue;

    await prisma.authOtp.update({
      where: { id: candidate.id },
      data: { consumedAt: new Date() }
    });
    return;
  }

  throw new HttpError(400, "Invalid or expired OTP");
}

authRouter.get(
  "/availability",
  asyncHandler(async (req, res) => {
    const result = identityAvailabilitySchema.safeParse(req.query);
    if (!result.success) throw new HttpError(422, "Validation failed");

    const response: {
      username?: { available: boolean; message: string };
      phone?: { available: boolean; message: string };
    } = {};

    const username = result.data.username?.trim().toLowerCase();
    if (username) {
      if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) {
        response.username = { available: false, message: "Use 3-24 letters, numbers, or underscores" };
      } else {
        const existing = await prisma.user.findFirst({
          where: { username: { equals: username, mode: "insensitive" } }
        });
        response.username = existing
          ? { available: false, message: isCurrentlyBlocked(existing) ? "This username is blocked" : "This username is already taken" }
          : { available: true, message: "Username is available" };
      }
    }

    const phone = result.data.phone?.trim();
    if (phone) {
      const normalizedPhone = normalizePhone(phone);
      const digits = normalizedPhone.replace(/\D/g, "");

      if (digits.length < 7 || digits.length > 18) {
        response.phone = { available: false, message: "Enter a valid phone number" };
      } else {
        const existing = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
        response.phone = existing
          ? { available: false, message: isCurrentlyBlocked(existing) ? "This phone number is blocked" : "This phone number is already registered" }
          : { available: true, message: "Phone number is available" };
      }
    }

    sendSuccess(res, response);
  })
);

authRouter.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, username, email, phone, country, avatarUrl, registrationDeviceId, password, referralCode } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedPhone = normalizePhone(phone);

    const existingEmail = await prisma.user.findFirst({ where: { email: { equals: normalizedEmail, mode: "insensitive" } } });
    if (existingEmail && isCurrentlyBlocked(existingEmail)) throw new HttpError(403, "This email is blocked from creating a new account");
    if (existingEmail) throw new HttpError(409, "An account already exists for this email");

    const existingUsername = await prisma.user.findFirst({ where: { username: { equals: normalizedUsername, mode: "insensitive" } } });
    if (existingUsername && isCurrentlyBlocked(existingUsername)) throw new HttpError(403, "This username is blocked from creating a new account");
    if (existingUsername) throw new HttpError(409, "This username is already taken");

    const existingPhone = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (existingPhone && isCurrentlyBlocked(existingPhone)) throw new HttpError(403, "This phone number is blocked from creating a new account");
    if (existingPhone) throw new HttpError(409, "An account already exists for this phone number");

    const existingDevice = await prisma.user.findUnique({ where: { registrationDeviceId } });
    if (existingDevice && isCurrentlyBlocked(existingDevice)) throw new HttpError(403, "This device is blocked from creating a new account");
    if (existingDevice) throw new HttpError(409, "This device has already been used to create an account");

    const cleanReferralCode = referralCode?.trim() || undefined;
    const referrer = cleanReferralCode
      ? await prisma.user.findUnique({ where: { referralCode: cleanReferralCode } })
      : null;
    if (cleanReferralCode && !referrer) throw new HttpError(400, "Referral code is not valid");
    const uploadedAvatarUrl = await uploadAvatarImage(avatarUrl);

    const user = await prisma.user.create({
      data: {
        name,
        username: normalizedUsername,
        email: normalizedEmail,
        phone: normalizedPhone,
        country: country.toUpperCase(),
        avatarUrl: uploadedAvatarUrl,
        registrationDeviceId,
        registrationIp: getClientIp(req),
        status: "PENDING",
        emailVerified: false,
        passwordHash: await bcrypt.hash(password, 12),
        referralCode: makeReferralCode(name),
        referredById: referrer?.id
      }
    });

    if (referrer) {
      await prisma.affiliateReferral.create({
        data: {
          referrerId: referrer.id,
          referredUserId: user.id,
          commissionRate: 10,
          status: "PENDING"
        }
      });
    }

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Welcome to PipNest Markets",
        message: "Please verify your email to activate your trader dashboard.",
        type: "SUCCESS"
      }
    });

    const emailSent = await sendVerificationOtp(user);

    sendSuccess(
      res,
      {
        verificationRequired: true,
        email: user.email,
        emailSent,
        message: emailSent
          ? "Registration successful. Check your email for the verification OTP."
          : "Registration successful, but the verification email could not be sent. Please check SMTP settings, then use the resend OTP button on the verification page."
      },
      201
    );
  })
);

authRouter.post(
  "/verify-email",
  validateBody(verifyEmailSchema),
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    if (!user) throw new HttpError(400, "Invalid or expired OTP");

    await consumeOtp({ email, userId: user.id, purpose: "EMAIL_VERIFICATION", code: req.body.otp });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, status: "APPROVED" }
    });
    const token = signToken({ id: updatedUser.id, email: updatedUser.email, role: updatedUser.role });

    sendSuccess(res, { token, user: publicUser(updatedUser), message: "Email verified successfully" });
  })
);

authRouter.post(
  "/resend-verification",
  validateBody(resendVerificationSchema),
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    let emailSent = false;

    if (user && !user.emailVerified) {
      emailSent = await sendVerificationOtp(user);
    }

    sendSuccess(res, {
      emailSent,
      message: emailSent
        ? "If the account needs verification, a new OTP has been sent."
        : "We could not send the verification email. Please check SMTP settings and try again."
    });
  })
);

authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { identifier, password, deviceId } = req.body;
    const login = identifier.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: login, mode: "insensitive" } },
          { username: { equals: login, mode: "insensitive" } }
        ]
      }
    });
    const activeUser = await ensureUserCanAuthenticate(user, "Invalid email/username or password");

    const valid = await bcrypt.compare(password, activeUser.passwordHash);
    if (!valid) throw new HttpError(401, "Invalid email/username or password");
    if (!activeUser.emailVerified || activeUser.status === "PENDING") {
      throw new HttpError(403, "Please verify your email before login.");
    }
    if (activeUser.twoFactorEnabled && !(await isTrustedTwoFactorDevice(activeUser.id, deviceId))) {
      const twoFactorToken = signToken(
        { id: activeUser.id, email: activeUser.email, role: activeUser.role, purpose: "2fa" },
        "10m"
      );
      sendSuccess(res, {
        twoFactorRequired: true,
        twoFactorToken,
        email: activeUser.email,
        message: "Enter your authenticator app code to continue."
      });
      return;
    }

    const updatedUser = await prisma.user.update({ where: { id: activeUser.id }, data: { lastLoginAt: new Date() } });
    const token = signToken({ id: updatedUser.id, email: updatedUser.email, role: updatedUser.role });
    await createLoginNotification(updatedUser, req);
    void sendActionOtpNotice(updatedUser, "login").catch((error) => console.error("Login OTP email failed:", error));
    void sendLoginNotice(updatedUser).catch((error) => console.error("Login email failed:", error));
    sendSuccess(res, { token, user: publicUser(updatedUser) });
  })
);

authRouter.post(
  "/2fa/login",
  validateBody(twoFactorLoginSchema),
  asyncHandler(async (req, res) => {
    const tokenPayload = verifyToken(req.body.twoFactorToken);
    if (tokenPayload.purpose !== "2fa") throw new HttpError(401, "Invalid two-factor session");

    const user = await prisma.user.findUnique({ where: { id: tokenPayload.id } });
    const activeUser = await ensureUserCanAuthenticate(user, "Invalid two-factor session");
    if (!activeUser.emailVerified || activeUser.status === "PENDING") {
      throw new HttpError(403, "Please verify your email before login.");
    }
    if (!activeUser.twoFactorEnabled || !activeUser.twoFactorSecret) throw new HttpError(400, "Two-factor authentication is not enabled");

    const secret = decryptTotpSecret(activeUser.twoFactorSecret);
    if (!verifyTotpCode(secret, req.body.code)) throw new HttpError(401, "Invalid authenticator code");
    await trustTwoFactorDevice(activeUser.id, req.body.deviceId);

    const updatedUser = await prisma.user.update({ where: { id: activeUser.id }, data: { lastLoginAt: new Date() } });
    const authToken = signToken({ id: updatedUser.id, email: updatedUser.email, role: updatedUser.role });
    await createLoginNotification(updatedUser, req);
    void sendActionOtpNotice(updatedUser, "two-factor login").catch((error) => console.error("2FA login OTP email failed:", error));
    void sendLoginNotice(updatedUser).catch((error) => console.error("Login email failed:", error));
    sendSuccess(res, { token: authToken, user: publicUser(updatedUser) });
  })
);

authRouter.post(
  "/2fa/setup",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
    if (user.twoFactorEnabled) throw new HttpError(400, "Two-factor authentication is already enabled");

    const secret = generateTotpSecret();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: encryptTotpSecret(secret),
        twoFactorEnabled: false,
        twoFactorConfirmedAt: null
      }
    });
    void sendActionOtpNotice(user, "authenticator setup").catch((error) => console.error("2FA setup OTP email failed:", error));

    sendSuccess(res, {
      secret,
      otpauthUrl: makeOtpAuthUrl(secret, user.email),
      message: "Add this key to your authenticator app, then enter the 6-digit code."
    });
  })
);

authRouter.post(
  "/2fa/confirm",
  authenticate,
  validateBody(twoFactorCodeSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
    if (!user.twoFactorSecret) throw new HttpError(400, "Start two-factor setup first");

    const secret = decryptTotpSecret(user.twoFactorSecret);
    if (!verifyTotpCode(secret, req.body.code)) throw new HttpError(401, "Invalid authenticator code");

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true, twoFactorConfirmedAt: new Date() }
    });
    await prisma.twoFactorTrustedDevice.deleteMany({ where: { userId: user.id } });
    void sendActionOtpNotice(updatedUser, "authenticator enabled").catch((error) => console.error("2FA enabled OTP email failed:", error));
    sendSuccess(res, { user: publicUser(updatedUser), message: "Two-factor authentication is enabled" });
  })
);

authRouter.post(
  "/2fa/disable",
  authenticate,
  validateBody(twoFactorCodeSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
    if (!user.twoFactorEnabled || !user.twoFactorSecret) throw new HttpError(400, "Two-factor authentication is not enabled");

    const secret = decryptTotpSecret(user.twoFactorSecret);
    if (!verifyTotpCode(secret, req.body.code)) throw new HttpError(401, "Invalid authenticator code");

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorConfirmedAt: null }
    });
    await prisma.twoFactorTrustedDevice.deleteMany({ where: { userId: user.id } });
    void sendActionOtpNotice(updatedUser, "authenticator disabled").catch((error) => console.error("2FA disabled OTP email failed:", error));
    sendSuccess(res, { user: publicUser(updatedUser), message: "Two-factor authentication is disabled" });
  })
);

authRouter.post(
  "/admin-login",
  validateBody(adminLoginSchema),
  asyncHandler(async (req, res) => {
    const { username, password, rememberMe } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
        role: { in: ["ADMIN", "SUPER_ADMIN"] }
      },
      include: { admin: true }
    });

    const activeUser = await ensureUserCanAuthenticate(user, "Invalid admin username or password");

    const valid = await bcrypt.compare(password, activeUser.passwordHash);
    if (!valid) throw new HttpError(401, "Invalid admin username or password");

    const updatedUser = await prisma.user.update({
      where: { id: activeUser.id },
      data: { lastLoginAt: new Date() },
      include: { admin: true }
    });
    const token = signToken({ id: updatedUser.id, email: updatedUser.email, role: updatedUser.role }, rememberMe ? "30d" : "8h");
    sendSuccess(res, { token, user: { ...publicUser(updatedUser), permissions: updatedUser.admin?.permissions ?? [] } });
  })
);

authRouter.post(
  "/logout",
  authenticate,
  asyncHandler(async (_req, res) => {
    sendSuccess(res, { message: "Logged out. Remove the token on the client." });
  })
);

authRouter.post(
  "/forgot-password",
  validateBody(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });

    if (user) {
      await sendPasswordResetOtp(user);
    }

    sendSuccess(res, {
      email,
      message: "If the email exists, a 4-digit reset OTP has been sent."
    });
  })
);

authRouter.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    if (!user) throw new HttpError(400, "Invalid or expired OTP");

    await consumeOtp({ email, userId: user.id, purpose: "PASSWORD_RESET", code: req.body.otp });
    const payoutHoldUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(req.body.password, 12),
        passwordChangedAt: new Date(),
        payoutHoldUntil
      }
    });
    await prisma.twoFactorTrustedDevice.deleteMany({ where: { userId: user.id } });

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Password changed",
        message: "Your password was changed. Payout requests are locked for 24 hours.",
        type: "WARNING"
      }
    });
    void sendPasswordChangedNotice(updatedUser, payoutHoldUntil).catch((error) => console.error("Password changed email failed:", error));

    sendSuccess(res, {
      message: "Password changed successfully. Please login with your new password.",
      payoutHoldUntil
    });
  })
);

authRouter.put(
  "/profile",
  authenticate,
  validateBody(profileSettingsSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
    const updateData: Record<string, unknown> = {};

    if (req.body.name !== undefined) updateData.name = req.body.name.trim();

    if (req.body.email !== undefined) {
      const normalizedEmail = normalizeEmail(req.body.email);
      const existingEmail = await prisma.user.findFirst({
        where: {
          id: { not: user.id },
          email: { equals: normalizedEmail, mode: "insensitive" }
        }
      });
      if (existingEmail) throw new HttpError(409, "Email is already assigned to another account");
      updateData.email = normalizedEmail;
    }

    if (req.body.phone !== undefined) {
      const rawPhone = req.body.phone.trim();
      if (rawPhone) {
        const normalizedPhone = normalizePhone(rawPhone);
        const existingPhone = await prisma.user.findFirst({
          where: {
            id: { not: user.id },
            phone: normalizedPhone
          }
        });
        if (existingPhone) throw new HttpError(409, "Phone number is already assigned to another account");
        updateData.phone = normalizedPhone;
      } else {
        updateData.phone = null;
      }
    }

    if (req.body.avatarUrl !== undefined) {
      updateData.avatarUrl = await uploadAvatarImage(req.body.avatarUrl);
    }

    if (req.body.newPassword) {
      const validCurrentPassword = await bcrypt.compare(req.body.currentPassword ?? "", user.passwordHash);
      if (!validCurrentPassword) throw new HttpError(401, "Current password is incorrect");
      updateData.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
      updateData.passwordChangedAt = new Date();
      updateData.payoutHoldUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await prisma.twoFactorTrustedDevice.deleteMany({ where: { userId: user.id } });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    sendSuccess(res, { user: publicUser(updatedUser), message: "Profile settings updated successfully" });
  })
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
      include: {
        admin: true,
        kycSubmissions: {
          select: { status: true },
          orderBy: { submittedAt: "desc" },
          take: 1
        }
      }
    });
    const { kycSubmissions, ...safeUser } = user;
    sendSuccess(res, {
      user: {
        ...publicUser(safeUser),
        permissions: user.admin?.permissions ?? [],
        kycStatus: kycSubmissions[0]?.status ?? null
      }
    });
  })
);
