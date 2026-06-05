import { Router } from "express";
import { z } from "zod";
import { payoutRequestSchema } from "@pipnest/shared";
import { prisma } from "../config/prisma.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { sendSecurityOtpEmail } from "../services/security-email.service.js";
import { HttpError, asyncHandler, sendSuccess } from "../utils/http.js";

const payoutStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "PAID", "REJECTED", "CANCELLED"]),
  adminNote: z.string().optional()
});

function toMoney(value: unknown) {
  return Number(value ?? 0);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

async function buildPayoutOverview(userId: string) {
  const [user, accounts, payouts, payments, orders, affiliateReferrals] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { payoutHoldUntil: true, isActive: true, blockedUntil: true, blockReason: true } }),
    prisma.tradingAccount.findMany({
      where: { userId },
      include: { challenge: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.payoutRequest.findMany({
      where: { userId },
      include: { tradingAccount: true },
      orderBy: { requestedAt: "desc" }
    }),
    prisma.payment.findMany({
      where: { userId },
      include: { order: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.order.findMany({
      where: { userId },
      include: { challenge: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.affiliateReferral.findMany({
      where: { referrerId: userId },
      include: { referredUser: true },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const pendingPayouts = payouts
    .filter((payout) => payout.status === "PENDING" || payout.status === "APPROVED")
    .reduce((total, payout) => total + toMoney(payout.amount), 0);
  const paidPayouts = payouts
    .filter((payout) => payout.status === "PAID")
    .reduce((total, payout) => total + toMoney(payout.amount), 0);
  const pendingByAccount = new Map<string, number>();

  for (const payout of payouts) {
    if (!payout.tradingAccountId || (payout.status !== "PENDING" && payout.status !== "APPROVED")) continue;
    pendingByAccount.set(payout.tradingAccountId, (pendingByAccount.get(payout.tradingAccountId) ?? 0) + toMoney(payout.amount));
  }

  const payoutAccounts = accounts.map((account) => {
    const accountSize = toMoney(account.challenge.accountSize);
    const equity = toMoney(account.equity);
    const grossProfit = Math.max(0, equity - accountSize);
    const pendingAmount = pendingByAccount.get(account.id) ?? 0;
    const eligible = account.accountStatus === "PASSED" && grossProfit > 0;

    return {
      id: account.id,
      login: account.login,
      platform: account.platform,
      server: account.server,
      status: account.accountStatus,
      challengeName: account.challenge.name,
      accountSize: roundMoney(accountSize),
      balance: roundMoney(toMoney(account.balance)),
      equity: roundMoney(equity),
      grossProfit: roundMoney(grossProfit),
      pendingPayouts: roundMoney(pendingAmount),
      availableBalance: eligible ? roundMoney(Math.max(0, grossProfit - pendingAmount)) : 0
    };
  });

  const availableBalance = roundMoney(payoutAccounts.reduce((total, account) => total + account.availableBalance, 0));

  const payoutHistory = payouts.map((payout) => ({
    id: payout.id,
    amount: roundMoney(toMoney(payout.amount)),
    method: payout.method,
    status: payout.status,
    requestedAt: payout.requestedAt.toISOString(),
    processedAt: payout.processedAt?.toISOString() ?? null,
    adminNote: payout.adminNote,
    tradingAccount: payout.tradingAccount
      ? {
          id: payout.tradingAccount.id,
          login: payout.tradingAccount.login,
          platform: payout.tradingAccount.platform
        }
      : null
  }));

  const ledger = [
    ...orders.map((order) => ({
      id: order.id,
      reference: order.orderNumber,
      type: "Challenge Order",
      direction: "DEBIT" as const,
      amount: roundMoney(toMoney(order.total)),
      status: order.status,
      date: order.createdAt.toISOString(),
      details: order.challenge.name
    })),
    ...payments.map((payment) => ({
      id: payment.id,
      reference: payment.providerPaymentId || payment.order?.orderNumber || payment.id,
      type: "Payment",
      direction: "DEBIT" as const,
      amount: roundMoney(toMoney(payment.amount)),
      status: payment.status,
      date: payment.createdAt.toISOString(),
      details: payment.provider
    })),
    ...payouts.map((payout) => ({
      id: payout.id,
      reference: payout.id,
      type: "Payout Request",
      direction: "CREDIT" as const,
      amount: roundMoney(toMoney(payout.amount)),
      status: payout.status,
      date: payout.requestedAt.toISOString(),
      details: payout.method
    })),
    ...affiliateReferrals.map((referral) => ({
      id: referral.id,
      reference: referral.referredUser.username || referral.referredUser.email,
      type: "Affiliate Commission",
      direction: "CREDIT" as const,
      amount: roundMoney(toMoney(referral.commissionAmount)),
      status: referral.status,
      date: referral.convertedAt?.toISOString() ?? referral.createdAt.toISOString(),
      details: `${referral.commissionRate}% referral`
    }))
  ]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 75);

  return {
    availableBalance,
    pendingPayouts: roundMoney(pendingPayouts),
    paidPayouts: roundMoney(paidPayouts),
    payoutHoldUntil: user?.payoutHoldUntil?.toISOString() ?? null,
    payoutBlocked: user ? !user.isActive && (!user.blockedUntil || user.blockedUntil > new Date()) : false,
    payoutBlockReason: user?.blockReason ?? null,
    accounts: payoutAccounts,
    payouts: payoutHistory,
    ledger
  };
}

export const payoutRouter = Router();
payoutRouter.use(authenticate);

payoutRouter.post(
  "/request",
  validateBody(payoutRequestSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user?.isActive && (!user?.blockedUntil || user.blockedUntil > new Date())) {
      throw new HttpError(403, user?.blockReason ? `Payout requests are blocked. Reason: ${user.blockReason}` : "Payout requests are blocked while your account is restricted.");
    }
    if (user?.payoutHoldUntil && user.payoutHoldUntil > new Date()) {
      throw new HttpError(403, `Payout requests are locked until ${user.payoutHoldUntil.toISOString()} after your password change.`);
    }

    if (req.body.method !== "MANUAL") {
      throw new HttpError(400, "Card, bank, and crypto payout gateways are not enabled yet. Please use manual payout for now.");
    }

    const overview = await buildPayoutOverview(req.user!.id);
    const selectedAccount = req.body.tradingAccountId
      ? overview.accounts.find((account) => account.id === req.body.tradingAccountId)
      : null;
    if (req.body.tradingAccountId && !selectedAccount) throw new HttpError(404, "Trading account not found");

    const availableBalance = selectedAccount?.availableBalance ?? overview.availableBalance;
    if (req.body.amount > availableBalance) {
      throw new HttpError(400, "Requested payout amount is greater than your available withdrawable balance");
    }

    const payout = await prisma.payoutRequest.create({
      data: {
        userId: req.user!.id,
        tradingAccountId: req.body.tradingAccountId,
        amount: req.body.amount,
        method: req.body.method,
        walletAddress: req.body.walletAddress,
        bankDetails: req.body.bankDetails
      }
    });
    if (user) {
      void sendSecurityOtpEmail({
        user,
        action: "payout request",
        details: `Manual payout request submitted for $${Number(req.body.amount).toFixed(2)}.`
      }).catch((error) => console.error("Payout request OTP email failed:", error));
    }
    sendSuccess(res, { payout }, 201);
  })
);

payoutRouter.get(
  "/overview",
  asyncHandler(async (req, res) => {
    const overview = await buildPayoutOverview(req.user!.id);
    sendSuccess(res, overview);
  })
);

payoutRouter.get(
  "/my",
  asyncHandler(async (req, res) => {
    const payouts = await prisma.payoutRequest.findMany({
      where: { userId: req.user!.id },
      include: { tradingAccount: true },
      orderBy: { requestedAt: "desc" }
    });
    sendSuccess(res, { payouts });
  })
);

export const adminPayoutRouter = Router();
adminPayoutRouter.use(authenticate, requireRole("ADMIN", "SUPER_ADMIN"));

adminPayoutRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const payouts = await prisma.payoutRequest.findMany({
      include: { user: true, tradingAccount: { include: { challenge: true } } },
      orderBy: { requestedAt: "desc" }
    });
    sendSuccess(res, { payouts });
  })
);

adminPayoutRouter.put(
  "/:id/status",
  validateBody(payoutStatusSchema),
  asyncHandler(async (req, res) => {
    const payout = await prisma.payoutRequest.update({
      where: { id: req.params.id },
      data: {
        status: req.body.status,
        adminNote: req.body.adminNote,
        processedAt: ["APPROVED", "PAID", "REJECTED", "CANCELLED"].includes(req.body.status) ? new Date() : null
      }
    });
    await prisma.notification.create({
      data: {
        userId: payout.userId,
        title: "Payout status updated",
        message: `Your payout request is now ${payout.status.toLowerCase()}.`,
        type: "PAYOUT"
      }
    });
    sendSuccess(res, { payout });
  })
);
