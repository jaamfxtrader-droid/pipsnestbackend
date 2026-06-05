import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler, HttpError, sendSuccess } from "../utils/http.js";

const cmsPageInclude = {
  sections: {
    where: { published: true },
    orderBy: { sortOrder: "asc" as const }
  }
};

export const cmsRouter = Router();

cmsRouter.get(
  "/home-metrics",
  asyncHandler(async (_req, res) => {
    const [
      activeChallenges,
      totalUsers,
      approvedUsers,
      paidOrders,
      activeAccounts,
      pendingPayouts,
      payoutVolume,
      revenue,
      largestChallenge,
      fastestChallenge
    ] = await Promise.all([
      prisma.challenge.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: "TRADER" } }),
      prisma.user.count({ where: { role: "TRADER", emailVerified: true, status: "APPROVED" } }),
      prisma.order.count({ where: { status: "PAID" } }),
      prisma.tradingAccount.count({ where: { accountStatus: { in: ["ACTIVE", "PASSED"] } } }),
      prisma.payoutRequest.count({ where: { status: "PENDING" } }),
      prisma.payoutRequest.aggregate({
        where: { status: { in: ["PENDING", "APPROVED", "PAID"] } },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { status: "SUCCEEDED" },
        _sum: { amount: true }
      }),
      prisma.challenge.findFirst({
        where: { isActive: true },
        orderBy: { accountSize: "desc" },
        select: { accountSize: true }
      }),
      prisma.challenge.findFirst({
        where: { isActive: true },
        orderBy: { minTradingDays: "asc" },
        select: { minTradingDays: true }
      })
    ]);

    const payoutAmount = Number(payoutVolume._sum.amount ?? 0);
    const revenueAmount = Number(revenue._sum.amount ?? 0);
    const topAllocation = Number(largestChallenge?.accountSize ?? 0);
    const fastestDays = Number(fastestChallenge?.minTradingDays ?? 0);

    sendSuccess(res, {
      journey: [
        {
          label: "Programs live",
          value: activeChallenges,
          suffix: activeChallenges === 1 ? "route" : "routes",
          helper: "Evaluation routes open for traders right now.",
          progress: activeChallenges > 0 ? 28 : 8
        },
        {
          label: "Verified traders",
          value: approvedUsers,
          suffix: approvedUsers === 1 ? "trader" : "traders",
          helper: "Email verified accounts ready for dashboard access.",
          progress: totalUsers > 0 ? Math.max(35, Math.round((approvedUsers / totalUsers) * 100)) : 18
        },
        {
          label: "Paid challenges",
          value: paidOrders,
          suffix: paidOrders === 1 ? "order" : "orders",
          helper: "Challenge entries moving through the funding flow.",
          progress: paidOrders > 0 ? 72 : 24
        },
        {
          label: "Active accounts",
          value: activeAccounts,
          suffix: activeAccounts === 1 ? "account" : "accounts",
          helper: "Trader accounts currently active or passed.",
          progress: activeAccounts > 0 ? 88 : 32
        }
      ],
      rewards: [
        {
          label: "Reward pipeline",
          value: payoutAmount,
          kind: "currency",
          helper: `${pendingPayouts} pending payout ${pendingPayouts === 1 ? "request" : "requests"}`
        },
        {
          label: "Top allocation",
          value: topAllocation,
          kind: "currency",
          helper: "Largest active challenge account size"
        },
        {
          label: "Fastest cycle",
          value: fastestDays,
          kind: "days",
          helper: "Minimum trading days from live challenges"
        },
        {
          label: "Challenge volume",
          value: revenueAmount,
          kind: "currency",
          helper: "Successful challenge purchases"
        }
      ],
      totals: {
        activeChallenges,
        totalUsers,
        approvedUsers,
        paidOrders,
        activeAccounts,
        pendingPayouts,
        payoutAmount,
        revenueAmount,
        topAllocation,
        fastestDays
      }
    });
  })
);

cmsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const pages = await prisma.cmsPage.findMany({
      where: { published: true },
      include: cmsPageInclude,
      orderBy: { slug: "asc" }
    });

    sendSuccess(res, { pages });
  })
);

cmsRouter.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const page = await prisma.cmsPage.findUnique({
      where: { slug: req.params.slug },
      include: cmsPageInclude
    });

    if (!page || !page.published) throw new HttpError(404, "CMS page was not found");
    sendSuccess(res, { page });
  })
);
