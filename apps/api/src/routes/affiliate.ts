import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { asyncHandler, sendSuccess } from "../utils/http.js";

export const affiliateRouter = Router();
affiliateRouter.use(authenticate);

affiliateRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
    const referrals = await prisma.affiliateReferral.findMany({
      where: { referrerId: req.user!.id },
      include: { referredUser: true }
    });
    const commission = referrals.reduce((sum, referral) => sum + Number(referral.commissionAmount), 0);
    sendSuccess(res, {
      referralCode: user.referralCode,
      referralUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/register?ref=${user.referralCode}`,
      totalReferrals: referrals.length,
      commission
    });
  })
);

affiliateRouter.get(
  "/referrals",
  asyncHandler(async (req, res) => {
    const referrals = await prisma.affiliateReferral.findMany({
      where: { referrerId: req.user!.id },
      include: { referredUser: true },
      orderBy: { createdAt: "desc" }
    });
    sendSuccess(res, { referrals });
  })
);

export const adminAffiliateRouter = Router();
adminAffiliateRouter.use(authenticate, requireRole("ADMIN", "SUPER_ADMIN"));

adminAffiliateRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const referrals = await prisma.affiliateReferral.findMany({
      include: { referrer: true, referredUser: true },
      orderBy: { createdAt: "desc" }
    });
    const summary = referrals.reduce(
      (totals, referral) => {
        totals.totalReferrals += 1;
        totals.totalCommission += Number(referral.commissionAmount);
        if (referral.status === "PENDING") totals.pendingReferrals += 1;
        if (referral.status === "ACTIVE") {
          totals.activeReferrals += 1;
          totals.unpaidCommission += Number(referral.commissionAmount);
        }
        if (referral.status === "PAID") {
          totals.paidReferrals += 1;
          totals.paidCommission += Number(referral.commissionAmount);
        }
        if (referral.status === "CANCELLED") totals.cancelledReferrals += 1;
        return totals;
      },
      {
        totalReferrals: 0,
        pendingReferrals: 0,
        activeReferrals: 0,
        paidReferrals: 0,
        cancelledReferrals: 0,
        totalCommission: 0,
        unpaidCommission: 0,
        paidCommission: 0
      }
    );

    const referrerMap = new Map<
      string,
      {
        referrer: (typeof referrals)[number]["referrer"];
        totalReferrals: number;
        activeReferrals: number;
        paidReferrals: number;
        commission: number;
      }
    >();

    referrals.forEach((referral) => {
      const existing =
        referrerMap.get(referral.referrerId) ??
        {
          referrer: referral.referrer,
          totalReferrals: 0,
          activeReferrals: 0,
          paidReferrals: 0,
          commission: 0
        };
      existing.totalReferrals += 1;
      existing.commission += Number(referral.commissionAmount);
      if (referral.status === "ACTIVE") existing.activeReferrals += 1;
      if (referral.status === "PAID") existing.paidReferrals += 1;
      referrerMap.set(referral.referrerId, existing);
    });

    const topReferrers = Array.from(referrerMap.values())
      .sort((first, second) => second.commission - first.commission || second.totalReferrals - first.totalReferrals)
      .slice(0, 10);

    sendSuccess(res, {
      summary,
      topReferrers,
      referrals
    });
  })
);
