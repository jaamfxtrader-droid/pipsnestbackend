import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { uploadAvatarImage } from "../services/cloudinary.service.js";
import { sendEmail } from "../services/email.service.js";
import { asyncHandler, HttpError, sendSuccess } from "../utils/http.js";
import { makeReferralCode, publicUser } from "../utils/user.js";

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().max(750_000, "Avatar image is too large").or(z.literal("")).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["TRADER", "ADMIN", "SUPER_ADMIN"]).optional(),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  permissions: z.array(z.string()).optional()
});

const createAdminUserSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3),
  email: z.string().email().optional(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]).default("ADMIN"),
  permissions: z.array(z.string()).default([])
});

const userStatusSchema = z
  .object({
    status: z.enum(["ACTIVE", "TEMPORARILY_BLOCKED", "PERMANENTLY_BLOCKED"]),
    blockedUntil: z.string().datetime().optional().nullable(),
    blockReason: z.string().trim().max(500).optional().nullable()
  })
  .superRefine((value, context) => {
    if (value.status === "ACTIVE") return;
    if (value.blockReason?.trim()) return;
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Block reason is required",
      path: ["blockReason"]
    });
  });

const adminRoleTemplateSchema = z.object({
  name: z.string().min(2),
  permissions: z.array(z.string()).default([])
});

const updateProfileSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3),
  email: z.string().email(),
  avatarUrl: z.string().max(750_000, "Avatar image is too large").or(z.literal("")).optional(),
  password: z.string().min(6).optional()
});

const couponSchema = z.object({
  code: z.string().min(3),
  description: z.string().optional(),
  category: z.enum(["CHALLENGE", "TOPUP", "ALL"]).default("CHALLENGE"),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().positive(),
  maxUses: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().optional()
});

const cmsSectionSchema = z.object({
  sectionKey: z.string().min(1),
  label: z.string().min(1),
  eyebrow: z.string().optional().nullable(),
  title: z.string().min(1),
  content: z.string().min(1),
  ctaLabel: z.string().optional().nullable(),
  ctaHref: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  sectionType: z.enum(["block", "grid", "flex", "carousel", "media", "split"]).default("block").optional(),
  imageUrl: z.string().optional().nullable(),
  iconName: z.string().optional().nullable(),
  colorScheme: z.string().optional().nullable(),
  position: z.coerce.number().int().default(0).optional(),
  metadata: z.record(z.any()).optional().nullable(),
  isVisible: z.boolean().default(true).optional(),
  published: z.boolean().optional()
});

const cmsSchema = z.object({
  slug: z.string().min(2),
  title: z.string().min(2),
  content: z.string().min(5),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metadata: z.record(z.any()).optional().nullable(),
  published: z.boolean().optional(),
  sections: z.array(cmsSectionSchema).optional()
});

const CMS_PAGE_SETTINGS_SECTION = "__page_settings";

export const adminRouter = Router();
adminRouter.use(authenticate, requireRole("ADMIN", "SUPER_ADMIN"));
const EMAIL_LOGO_URL = "https://pipnestmarkets.com/logo-icon.png";

const defaultAdminRoleTemplates = [
  { name: "Super Admin", permissions: ["admin:all", "cms:all"] },
  { name: "CMS Manager", permissions: ["cms:all"] },
  { name: "Support Pages", permissions: ["page:contact", "page:faq"] }
];

async function ensureDefaultAdminRoleTemplates() {
  await Promise.all(
    defaultAdminRoleTemplates.map((role) =>
      prisma.adminRoleTemplate.upsert({
        where: { name: role.name },
        update: { permissions: role.permissions, locked: true },
        create: { ...role, locked: true }
      })
    )
  );
}

async function getAdminPermissions(userId: string) {
  const admin = await prisma.admin.findUnique({ where: { userId } });
  return admin?.permissions ?? [];
}

async function assertUniqueIdentity(userId: string, values: { email?: string; username?: string }) {
  const checks = [];
  if (values.email) checks.push({ email: values.email });
  if (values.username) checks.push({ username: values.username });
  if (checks.length === 0) return;

  const existing = await prisma.user.findFirst({
    where: {
      id: { not: userId },
      OR: checks
    }
  });

  if (existing) throw new HttpError(409, "Email or username is already assigned to another user");
}

function pagePermission(slug: string) {
  return `page:${slug}`;
}

function serializeCmsPage<T extends { sections?: Array<{ sectionKey: string; metadata: unknown }> }>(page: T) {
  const settings = page.sections?.find((section) => section.sectionKey === CMS_PAGE_SETTINGS_SECTION);
  return {
    ...page,
    metadata: (settings?.metadata as Record<string, unknown> | null) ?? null,
    sections: page.sections?.filter((section) => section.sectionKey !== CMS_PAGE_SETTINGS_SECTION) ?? []
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendUserStatusNotice(input: {
  name: string;
  email: string;
  status: "TEMPORARILY_BLOCKED" | "PERMANENTLY_BLOCKED";
  reason: string;
  blockedUntil?: Date | null;
}) {
  const statusLabel = input.status === "TEMPORARILY_BLOCKED" ? "temporarily blocked" : "permanently blocked";
  const untilText = input.blockedUntil ? ` This restriction is currently set until ${input.blockedUntil.toISOString()}.` : "";
  const text = `Hi ${input.name}, your PipNest Markets account has been ${statusLabel}.${untilText} Reason: ${input.reason}`;
  const html = `
    <div style="margin:0;padding:32px;background:#f4f8ff;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dbe7ff;border-radius:18px;overflow:hidden;">
        <div style="padding:28px 30px;background:#061126;color:#ffffff;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:18px;">
            <tr>
              <td><img src="${EMAIL_LOGO_URL}" width="48" height="48" alt="PipNest Markets" style="display:block;border-radius:12px;background:#ffffff;" /></td>
              <td style="text-align:right;font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#93c5fd;">PipNest Markets</td>
            </tr>
          </table>
          <h1 style="margin:0;font-size:24px;line-height:1.25;">Your account has been ${escapeHtml(statusLabel)}</h1>
        </div>
        <div style="padding:30px;line-height:1.7;">
          <p>Hi ${escapeHtml(input.name)},</p>
          <p>Your PipNest Markets account has been ${escapeHtml(statusLabel)} by the admin team.${escapeHtml(untilText)}</p>
          <p><strong>Reason:</strong> ${escapeHtml(input.reason)}</p>
          <p>While this restriction is active, payout requests are not available.</p>
          <p>If you believe this is a mistake, please contact support.</p>
        </div>
      </div>
    </div>
  `;

  await sendEmail({
    to: input.email,
    subject: `Your PipNest Markets account has been ${statusLabel}`,
    text,
    html
  });
}

async function assertCanManageCmsPage(userId: string, role: string, slug: string) {
  if (role === "SUPER_ADMIN") return;
  const permissions = await getAdminPermissions(userId);
  if (permissions.includes("cms:all") || permissions.includes(pagePermission(slug))) return;
  throw new HttpError(403, "This admin does not have access to this CMS page");
}

function asNumber(value: unknown) {
  return Number(value ?? 0);
}

function percentOf(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0;
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function buildDayBuckets(days: number) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return Array.from({ length: days }, (_item, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (days - index - 1));
    return {
      date: dayKey(date),
      label: dayLabel(date),
      revenue: 0,
      topUps: 0,
      payouts: 0,
      orders: 0
    };
  });
}

function normalizeStatusRows<T extends { _count: Record<string, number>; _sum?: Record<string, unknown> }>(
  rows: T[],
  statusKey: keyof T,
  sumKey = "amount"
) {
  return rows.map((row) => ({
    status: String(row[statusKey]),
    count: Object.values(row._count)[0] ?? 0,
    amount: asNumber(row._sum?.[sumKey])
  }));
}

async function buildAdminAnalytics() {
  const monthStart = startOfCurrentMonth();
  const seriesStart = new Date();
  seriesStart.setUTCDate(seriesStart.getUTCDate() - 13);
  seriesStart.setUTCHours(0, 0, 0, 0);

  const [
    totalTraders,
    activeTraders,
    blockedTraders,
    pendingTraders,
    adminUsers,
    activeChallenges,
    totalChallenges,
    totalOrders,
    paidOrders,
    pendingOrders,
    grossRevenue,
    monthRevenue,
    approvedTopUps,
    pendingTopUps,
    monthTopUps,
    pendingPayouts,
    pendingPayoutAmount,
    paidPayouts,
    monthPaidPayouts,
    openTickets,
    urgentTickets,
    pendingKyc,
    approvedKyc,
    accountStatusRows,
    orderStatusRows,
    payoutStatusRows,
    topUpStatusRows,
    kycStatusRows,
    drawdownAverages,
    seriesPayments,
    seriesOrders,
    seriesTopUps,
    seriesPayouts,
    challengeRows,
    recentUsers,
    recentOrders,
    recentTopUps,
    recentPayoutRows,
    recentTickets
  ] = await Promise.all([
    prisma.user.count({ where: { role: "TRADER" } }),
    prisma.user.count({ where: { role: "TRADER", isActive: true, status: "APPROVED", emailVerified: true } }),
    prisma.user.count({ where: { role: "TRADER", isActive: false } }),
    prisma.user.count({ where: { role: "TRADER", OR: [{ status: "PENDING" }, { emailVerified: false }] } }),
    prisma.user.count({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } }),
    prisma.challenge.count({ where: { isActive: true } }),
    prisma.challenge.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.payment.aggregate({ where: { status: "SUCCEEDED" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: "SUCCEEDED", createdAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.topUpTransaction.aggregate({ where: { status: "APPROVED" }, _sum: { amount: true }, _count: { id: true } }),
    prisma.topUpTransaction.count({ where: { status: "PENDING" } }),
    prisma.topUpTransaction.aggregate({ where: { status: "APPROVED", createdAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.payoutRequest.count({ where: { status: "PENDING" } }),
    prisma.payoutRequest.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } }),
    prisma.payoutRequest.aggregate({ where: { status: "PAID" }, _sum: { amount: true }, _count: { id: true } }),
    prisma.payoutRequest.aggregate({ where: { status: "PAID", requestedAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.supportTicket.count({ where: { priority: "URGENT", status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.kycSubmission.count({ where: { status: "PENDING" } }),
    prisma.kycSubmission.count({ where: { status: "APPROVED" } }),
    prisma.tradingAccount.groupBy({ by: ["accountStatus"], _count: { accountStatus: true } }),
    prisma.order.groupBy({ by: ["status"], _count: { status: true }, _sum: { total: true } }),
    prisma.payoutRequest.groupBy({ by: ["status"], _count: { status: true }, _sum: { amount: true } }),
    prisma.topUpTransaction.groupBy({ by: ["status"], _count: { status: true }, _sum: { amount: true } }),
    prisma.kycSubmission.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.tradingStats.aggregate({
      _avg: { dailyDrawdown: true, maxDrawdown: true, profitTargetProgress: true },
      where: { account: { accountStatus: "ACTIVE" } }
    }),
    prisma.payment.findMany({ where: { status: "SUCCEEDED", createdAt: { gte: seriesStart } }, select: { amount: true, createdAt: true } }),
    prisma.order.findMany({ where: { status: "PAID", createdAt: { gte: seriesStart } }, select: { createdAt: true } }),
    prisma.topUpTransaction.findMany({ where: { status: "APPROVED", createdAt: { gte: seriesStart } }, select: { amount: true, createdAt: true } }),
    prisma.payoutRequest.findMany({ where: { status: "PAID", requestedAt: { gte: seriesStart } }, select: { amount: true, requestedAt: true } }),
    prisma.challenge.findMany({
      include: {
        orders: { where: { status: "PAID" }, select: { total: true } },
        _count: { select: { orders: true, tradingAccounts: true } }
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
    }),
    prisma.user.findMany({ where: { role: "TRADER" }, select: { id: true, name: true, email: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.order.findMany({ include: { user: true, challenge: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.topUpTransaction.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.payoutRequest.findMany({ include: { user: true }, orderBy: { requestedAt: "desc" }, take: 5 }),
    prisma.supportTicket.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 5 })
  ]);

  const accountStatuses = normalizeStatusRows(accountStatusRows, "accountStatus");
  const orderStatuses = normalizeStatusRows(orderStatusRows, "status", "total");
  const payoutStatuses = normalizeStatusRows(payoutStatusRows, "status");
  const topUpStatuses = normalizeStatusRows(topUpStatusRows, "status");
  const kycStatuses = normalizeStatusRows(kycStatusRows, "status");
  const passedAccounts = accountStatuses.find((row) => row.status === "PASSED")?.count ?? 0;
  const failedAccounts = accountStatuses.find((row) => row.status === "FAILED")?.count ?? 0;
  const activeAccounts = accountStatuses.find((row) => row.status === "ACTIVE")?.count ?? 0;
  const pendingAccounts = accountStatuses.find((row) => row.status === "PENDING")?.count ?? 0;

  const series = buildDayBuckets(14);
  const seriesByDate = new Map(series.map((entry) => [entry.date, entry]));
  seriesPayments.forEach((payment) => {
    const bucket = seriesByDate.get(dayKey(payment.createdAt));
    if (bucket) bucket.revenue += asNumber(payment.amount);
  });
  seriesOrders.forEach((order) => {
    const bucket = seriesByDate.get(dayKey(order.createdAt));
    if (bucket) bucket.orders += 1;
  });
  seriesTopUps.forEach((topUp) => {
    const bucket = seriesByDate.get(dayKey(topUp.createdAt));
    if (bucket) bucket.topUps += asNumber(topUp.amount);
  });
  seriesPayouts.forEach((payout) => {
    const bucket = seriesByDate.get(dayKey(payout.requestedAt));
    if (bucket) bucket.payouts += asNumber(payout.amount);
  });

  const challengePerformance = challengeRows
    .map((challenge) => ({
      id: challenge.id,
      name: challenge.name,
      phaseCount: challenge.phaseCount,
      isActive: challenge.isActive,
      price: asNumber(challenge.price),
      accountSize: asNumber(challenge.accountSize),
      orders: challenge._count.orders,
      accounts: challenge._count.tradingAccounts,
      revenue: challenge.orders.reduce((sum, order) => sum + asNumber(order.total), 0)
    }))
    .sort((first, second) => second.revenue - first.revenue || second.orders - first.orders);

  const recentActivity = [
    ...recentUsers.map((user) => ({
      id: `user-${user.id}`,
      type: "Trader joined",
      title: user.name,
      description: user.email,
      status: user.status,
      amount: null,
      createdAt: user.createdAt
    })),
    ...recentOrders.map((order) => ({
      id: `order-${order.id}`,
      type: "Challenge order",
      title: order.challenge.name,
      description: `${order.user.name} / ${order.orderNumber}`,
      status: order.status,
      amount: asNumber(order.total),
      createdAt: order.createdAt
    })),
    ...recentTopUps.map((topUp) => ({
      id: `topup-${topUp.id}`,
      type: "Top-up",
      title: topUp.user.name,
      description: topUp.reference ?? topUp.method,
      status: topUp.status,
      amount: asNumber(topUp.amount),
      createdAt: topUp.createdAt
    })),
    ...recentPayoutRows.map((payout) => ({
      id: `payout-${payout.id}`,
      type: "Payout",
      title: payout.user.name,
      description: payout.method,
      status: payout.status,
      amount: asNumber(payout.amount),
      createdAt: payout.requestedAt
    })),
    ...recentTickets.map((ticket) => ({
      id: `ticket-${ticket.id}`,
      type: "Support ticket",
      title: ticket.subject,
      description: ticket.user.name,
      status: ticket.status,
      amount: null,
      createdAt: ticket.createdAt
    }))
  ]
    .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime())
    .slice(0, 12);

  return {
    metrics: {
      totalTraders,
      activeTraders,
      blockedTraders,
      pendingTraders,
      adminUsers,
      activeChallenges,
      totalChallenges,
      totalOrders,
      paidOrders,
      pendingOrders,
      grossRevenue: asNumber(grossRevenue._sum.amount),
      revenueThisMonth: asNumber(monthRevenue._sum.amount),
      approvedTopUpAmount: asNumber(approvedTopUps._sum.amount),
      approvedTopUpCount: approvedTopUps._count.id,
      pendingTopUps,
      topUpsThisMonth: asNumber(monthTopUps._sum.amount),
      pendingPayouts,
      pendingPayoutAmount: asNumber(pendingPayoutAmount._sum.amount),
      paidPayoutAmount: asNumber(paidPayouts._sum.amount),
      paidPayoutCount: paidPayouts._count.id,
      paidPayoutsThisMonth: asNumber(monthPaidPayouts._sum.amount),
      openTickets,
      urgentTickets,
      pendingKyc,
      approvedKyc,
      activeAccounts,
      pendingAccounts,
      passedAccounts,
      failedAccounts,
      passRate: percentOf(passedAccounts, passedAccounts + failedAccounts),
      avgDailyDrawdown: asNumber(drawdownAverages._avg.dailyDrawdown),
      avgMaxDrawdown: asNumber(drawdownAverages._avg.maxDrawdown),
      avgTargetProgress: asNumber(drawdownAverages._avg.profitTargetProgress)
    },
    series,
    accountStatuses,
    orderStatuses,
    payoutStatuses,
    topUpStatuses,
    kycStatuses,
    challengePerformance,
    recentActivity
  };
}

adminRouter.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const analytics = await buildAdminAnalytics();
    sendSuccess(res, analytics);
  })
);

adminRouter.get(
  "/admins",
  asyncHandler(async (_req, res) => {
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      include: { admin: true },
      orderBy: [{ role: "desc" }, { name: "asc" }]
    });
    sendSuccess(res, {
      users: admins.map((user) => ({
        ...publicUser(user),
        permissions: user.admin?.permissions ?? []
      }))
    });
  })
);

adminRouter.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const [users, totalUsers, pendingUsers, blockedUsers] = await Promise.all([
      prisma.user.findMany({ where: { role: "TRADER" }, include: { admin: true }, orderBy: { createdAt: "desc" } }),
      prisma.user.count({ where: { role: "TRADER" } }),
      prisma.user.count({ where: { role: "TRADER", OR: [{ status: "PENDING" }, { emailVerified: false }] } }),
      prisma.user.count({ where: { role: "TRADER", isActive: false } })
    ]);
    sendSuccess(res, {
      stats: {
        totalUsers,
        pendingUsers,
        approvedUsers: Math.max(totalUsers - pendingUsers, 0),
        blockedUsers
      },
      users: users.map((user) => ({
        ...publicUser(user),
        permissions: user.admin?.permissions ?? []
      }))
    });
  })
);

adminRouter.get(
  "/roles",
  asyncHandler(async (req, res) => {
    if (req.user!.role !== "SUPER_ADMIN") throw new HttpError(403, "Only super admin can manage admin roles");

    await ensureDefaultAdminRoleTemplates();
    const roles = await prisma.adminRoleTemplate.findMany({ orderBy: [{ locked: "desc" }, { createdAt: "asc" }] });
    sendSuccess(res, { roles });
  })
);

adminRouter.post(
  "/roles",
  validateBody(adminRoleTemplateSchema),
  asyncHandler(async (req, res) => {
    if (req.user!.role !== "SUPER_ADMIN") throw new HttpError(403, "Only super admin can manage admin roles");

    const existing = await prisma.adminRoleTemplate.findUnique({ where: { name: req.body.name } });
    if (existing) throw new HttpError(409, "A role template with this name already exists");

    const role = await prisma.adminRoleTemplate.create({
      data: {
        name: req.body.name,
        permissions: req.body.permissions,
        locked: false
      }
    });
    sendSuccess(res, { role }, 201);
  })
);

adminRouter.delete(
  "/roles/:id",
  asyncHandler(async (req, res) => {
    if (req.user!.role !== "SUPER_ADMIN") throw new HttpError(403, "Only super admin can manage admin roles");

    const role = await prisma.adminRoleTemplate.findUnique({ where: { id: req.params.id } });
    if (!role) throw new HttpError(404, "Role template not found");
    if (role.locked) throw new HttpError(400, "Default role templates cannot be deleted");

    await prisma.adminRoleTemplate.delete({ where: { id: role.id } });
    sendSuccess(res, { message: "Role template deleted" });
  })
);

adminRouter.put(
  "/profile",
  validateBody(updateProfileSchema),
  asyncHandler(async (req, res) => {
    if (req.user!.role !== "SUPER_ADMIN") throw new HttpError(403, "Only super admin can update admin settings");

    await assertUniqueIdentity(req.user!.id, { email: req.body.email, username: req.body.username });
    const passwordHash = req.body.password ? await bcrypt.hash(req.body.password, 12) : undefined;
    const uploadedAvatarUrl = await uploadAvatarImage(req.body.avatarUrl);

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        name: req.body.name,
        email: req.body.email,
        username: req.body.username,
        avatarUrl: uploadedAvatarUrl,
        ...(passwordHash ? { passwordHash } : {})
      },
      include: { admin: true }
    });

    sendSuccess(res, { user: { ...publicUser(user), permissions: user.admin?.permissions ?? [] } });
  })
);

adminRouter.post(
  "/users",
  validateBody(createAdminUserSchema),
  asyncHandler(async (req, res) => {
    if (req.user!.role !== "SUPER_ADMIN") throw new HttpError(403, "Only super admin can create admin users");

    const email = req.body.email ?? `${req.body.username}@pipnest.local`;
    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username: req.body.username }] } });
    if (existing) throw new HttpError(409, "An admin with this username or email already exists");

    const user = await prisma.user.create({
      data: {
        name: req.body.name,
        email,
        username: req.body.username,
        passwordHash: await bcrypt.hash(req.body.password, 12),
        role: req.body.role,
        emailVerified: true,
        status: "APPROVED",
        referralCode: makeReferralCode(req.body.username),
        admin: {
          create: {
            permissions: req.body.role === "SUPER_ADMIN" ? ["admin:all", "cms:all"] : req.body.permissions
          }
        }
      },
      include: { admin: true }
    });

    sendSuccess(res, { user: { ...publicUser(user), permissions: user.admin?.permissions ?? [] } }, 201);
  })
);

adminRouter.put(
  "/users/:id",
  validateBody(updateUserSchema),
  asyncHandler(async (req, res) => {
    if (req.user!.role !== "SUPER_ADMIN") throw new HttpError(403, "Only super admin can update admin users");
    if (req.body.role === "SUPER_ADMIN" && req.user!.role !== "SUPER_ADMIN") {
      throw new HttpError(403, "Only super admin can promote another super admin");
    }
    if (req.params.id === req.user!.id && req.body.role && req.body.role !== "SUPER_ADMIN") {
      throw new HttpError(400, "Super admin cannot demote their own account");
    }

    await assertUniqueIdentity(req.params.id, { email: req.body.email, username: req.body.username });
    const { permissions, password, avatarUrl, ...userUpdate } = req.body;
    const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;
    const uploadedAvatarUrl = await uploadAvatarImage(avatarUrl);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...userUpdate,
        ...(typeof req.body.emailVerified === "boolean" ? { status: req.body.emailVerified ? "APPROVED" : "PENDING" } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl === "" ? null : uploadedAvatarUrl } : {}),
        ...(passwordHash ? { passwordHash } : {})
      },
      include: { admin: true }
    });

    if (req.body.role === "ADMIN" || req.body.role === "SUPER_ADMIN" || permissions) {
      await prisma.admin.upsert({
        where: { userId: user.id },
        update: { permissions: req.body.role === "SUPER_ADMIN" ? ["admin:all", "cms:all"] : permissions ?? user.admin?.permissions ?? [] },
        create: { userId: user.id, permissions: req.body.role === "SUPER_ADMIN" ? ["admin:all", "cms:all"] : permissions ?? [] }
      });
    }

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, include: { admin: true } });
    sendSuccess(res, { user: { ...publicUser(updated), permissions: updated.admin?.permissions ?? [] } });
  })
);

adminRouter.patch(
  "/users/:id/status",
  validateBody(userStatusSchema),
  asyncHandler(async (req, res) => {
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) throw new HttpError(404, "User not found");
    if (target.role !== "TRADER") {
      throw new HttpError(400, "Only trader users can be managed from the user page");
    }

    const blockedUntil = req.body.blockedUntil ? new Date(req.body.blockedUntil) : null;
    if (req.body.status === "TEMPORARILY_BLOCKED" && (!blockedUntil || Number.isNaN(blockedUntil.getTime()) || blockedUntil <= new Date())) {
      throw new HttpError(400, "Temporary block needs a future expiry date");
    }

    const data =
      req.body.status === "ACTIVE"
        ? {
            isActive: true,
            blockedAt: null,
            blockedUntil: null,
            blockReason: null,
            blockedById: null
          }
        : {
            isActive: false,
            blockedAt: new Date(),
            blockedUntil: req.body.status === "TEMPORARILY_BLOCKED" ? blockedUntil : null,
            blockReason: req.body.blockReason?.trim() || null,
            blockedById: req.user!.id
          };

    const user = await prisma.user.update({
      where: { id: target.id },
      data,
      include: { admin: true }
    });

    if (req.body.status !== "ACTIVE") {
      const reason = req.body.blockReason!.trim();
      await Promise.all([
        sendUserStatusNotice({
          name: user.name,
          email: user.email,
          status: req.body.status,
          reason,
          blockedUntil
        }),
        prisma.notification.create({
          data: {
            userId: user.id,
            title: req.body.status === "TEMPORARILY_BLOCKED" ? "Account temporarily blocked" : "Account blocked",
            message:
              req.body.status === "TEMPORARILY_BLOCKED"
                ? `Your account has been temporarily blocked. Reason: ${reason}`
                : `Your account has been blocked. Reason: ${reason}`,
            type: "WARNING"
          }
        })
      ]);
    } else if (!target.isActive) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Account restored",
          message: "Your account access has been restored.",
          type: "SUCCESS"
        }
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: "USER_STATUS_UPDATED",
        entity: "User",
        entityId: target.id,
        metadata: {
          status: req.body.status,
          blockedUntil: blockedUntil?.toISOString() ?? null
        }
      }
    });

    sendSuccess(res, { user: { ...publicUser(user), permissions: user.admin?.permissions ?? [] } });
  })
);

adminRouter.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    if (req.user!.role !== "SUPER_ADMIN") throw new HttpError(403, "Only super admin can delete admin users");
    if (req.params.id === req.user!.id) throw new HttpError(400, "Super admin cannot delete their own account");

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new HttpError(404, "User not found");
    if (user.role === "TRADER") throw new HttpError(400, "Only admin users can be deleted from admin settings");

    await prisma.user.delete({ where: { id: req.params.id } });
    sendSuccess(res, { message: "Admin user deleted" });
  })
);

adminRouter.get(
  "/reports",
  asyncHandler(async (_req, res) => {
    const analytics = await buildAdminAnalytics();
    sendSuccess(res, analytics);
  })
);

adminRouter.get(
  "/coupons",
  asyncHandler(async (_req, res) => {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    sendSuccess(res, { coupons });
  })
);

adminRouter.post(
  "/coupons",
  validateBody(couponSchema),
  asyncHandler(async (req, res) => {
    const coupon = await prisma.coupon.create({
      data: { ...req.body, code: req.body.code.toUpperCase() }
    });
    sendSuccess(res, { coupon }, 201);
  })
);

adminRouter.put(
  "/coupons/:id",
  validateBody(couponSchema.partial()),
  asyncHandler(async (req, res) => {
    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        ...(req.body.code ? { code: req.body.code.toUpperCase() } : {})
      }
    });
    sendSuccess(res, { coupon });
  })
);

adminRouter.delete(
  "/coupons/:id",
  asyncHandler(async (req, res) => {
    const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } });
    if (!coupon) throw new HttpError(404, "Coupon not found");
    if (coupon.usedCount > 0) {
      const updated = await prisma.coupon.update({
        where: { id: coupon.id },
        data: { isActive: false }
      });
      sendSuccess(res, { coupon: updated, message: "Coupon has usage history, so it was marked inactive instead of deleted." });
      return;
    }

    await prisma.coupon.delete({ where: { id: coupon.id } });
    sendSuccess(res, { message: "Coupon deleted" });
  })
);

adminRouter.get(
  "/cms",
  asyncHandler(async (req, res) => {
    const permissions = req.user!.role === "SUPER_ADMIN" ? ["cms:all"] : await getAdminPermissions(req.user!.id);
    const allowedSlugs = permissions.filter((permission) => permission.startsWith("page:")).map((permission) => permission.replace("page:", ""));

    const pages = await prisma.cmsPage.findMany({
      where: req.user!.role === "SUPER_ADMIN" || permissions.includes("cms:all") ? undefined : { slug: { in: allowedSlugs } },
      include: { sections: { orderBy: { sortOrder: "asc" } } },
      orderBy: { updatedAt: "desc" }
    });
    sendSuccess(res, { pages: pages.map(serializeCmsPage) });
  })
);

adminRouter.post(
  "/cms",
  validateBody(cmsSchema),
  asyncHandler(async (req, res) => {
    await assertCanManageCmsPage(req.user!.id, req.user!.role, req.body.slug);

    const page = await prisma.cmsPage.upsert({
      where: { slug: req.body.slug },
      update: {
        title: req.body.title,
        content: req.body.content,
        metaTitle: req.body.metaTitle,
        metaDescription: req.body.metaDescription,
        published: req.body.published,
        updatedById: req.user!.id
      },
      create: {
        slug: req.body.slug,
        title: req.body.title,
        content: req.body.content,
        metaTitle: req.body.metaTitle,
        metaDescription: req.body.metaDescription,
        published: req.body.published,
        updatedById: req.user!.id
      }
    });

    await prisma.cmsSection.upsert({
      where: {
        pageSlug_sectionKey: {
          pageSlug: req.body.slug,
          sectionKey: CMS_PAGE_SETTINGS_SECTION
        }
      },
      update: {
        label: "Page Settings",
        title: "Page Settings",
        content: "Hidden CMS page settings",
        metadata: req.body.metadata ?? {},
        published: false,
        updatedById: req.user!.id
      },
      create: {
        pageId: page.id,
        pageSlug: req.body.slug,
        sectionKey: CMS_PAGE_SETTINGS_SECTION,
        label: "Page Settings",
        title: "Page Settings",
        content: "Hidden CMS page settings",
        sortOrder: -1,
        metadata: req.body.metadata ?? {},
        published: false,
        updatedById: req.user!.id
      }
    });

    if (req.body.sections) {
      const sections = req.body.sections as z.infer<typeof cmsSectionSchema>[];
      const sectionKeys = sections.map((section) => section.sectionKey);
      await prisma.cmsSection.deleteMany({
        where: {
          pageSlug: req.body.slug,
          sectionKey: { notIn: [...sectionKeys, CMS_PAGE_SETTINGS_SECTION] }
        }
      });
      await Promise.all(
        sections.map((section) =>
          prisma.cmsSection.upsert({
            where: {
              pageSlug_sectionKey: {
                pageSlug: req.body.slug,
                sectionKey: section.sectionKey
              }
            },
            update: {
              label: section.label,
              eyebrow: section.eyebrow ?? null,
              title: section.title,
              content: section.content,
              ctaLabel: section.ctaLabel ?? null,
              ctaHref: section.ctaHref ?? null,
              sortOrder: section.sortOrder,
              sectionType: section.sectionType ?? "block",
              imageUrl: section.imageUrl ?? null,
              iconName: section.iconName ?? null,
              colorScheme: section.colorScheme ?? null,
              position: section.position ?? 0,
              metadata: section.metadata ?? undefined,
              isVisible: section.isVisible ?? true,
              published: section.published ?? req.body.published ?? true,
              updatedById: req.user!.id
            },
            create: {
              pageId: page.id,
              pageSlug: req.body.slug,
              sectionKey: section.sectionKey,
              label: section.label,
              eyebrow: section.eyebrow ?? null,
              title: section.title,
              content: section.content,
              ctaLabel: section.ctaLabel ?? null,
              ctaHref: section.ctaHref ?? null,
              sortOrder: section.sortOrder,
              sectionType: section.sectionType ?? "block",
              imageUrl: section.imageUrl ?? null,
              iconName: section.iconName ?? null,
              colorScheme: section.colorScheme ?? null,
              position: section.position ?? 0,
              metadata: section.metadata ?? undefined,
              isVisible: section.isVisible ?? true,
              published: section.published ?? req.body.published ?? true,
              updatedById: req.user!.id
            }
          })
        )
      );
    }

    const savedPage = await prisma.cmsPage.findUniqueOrThrow({
      where: { slug: req.body.slug },
      include: { sections: { orderBy: { sortOrder: "asc" } } }
    });
    sendSuccess(res, { page: serializeCmsPage(savedPage) });
  })
);

adminRouter.post(
  "/cms/publish-all",
  asyncHandler(async (req, res) => {
    if (req.user!.role !== "SUPER_ADMIN") throw new HttpError(403, "Only super admin can publish the whole site");

    await prisma.$transaction([
      prisma.cmsPage.updateMany({ data: { published: true, updatedById: req.user!.id } }),
      prisma.cmsSection.updateMany({ data: { published: true, updatedById: req.user!.id } })
    ]);
    sendSuccess(res, { message: "Whole site CMS content has been published." });
  })
);
