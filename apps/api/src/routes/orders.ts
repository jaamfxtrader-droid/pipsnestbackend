import { Router } from "express";
import { z } from "zod";
import { orderSchema } from "@pipnest/shared";
import { prisma } from "../config/prisma.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { HttpError, asyncHandler, sendSuccess } from "../utils/http.js";
import { getTopUpBalance } from "../services/topup.service.js";
import { sendSecurityOtpEmail } from "../services/security-email.service.js";
import { createNowPayment } from "../services/nowpayments.service.js";
import { makeOrderNumber } from "../utils/user.js";

export const orderRouter = Router();
orderRouter.use(authenticate);

const terminalOrderStatuses = ["CANCELLED", "FAILED", "REFUNDED"] as const;
const terminalAccountStatuses = ["FAILED", "SUSPENDED"] as const;

function hasOpenChallengeOrder(
  order: {
    status: string;
    payments: Array<{ status: string }>;
    accounts: Array<{ accountStatus: string }>;
  }
) {
  const paid = order.status === "PAID" || order.payments.some((payment) => payment.status === "SUCCEEDED");
  const terminalOrder = terminalOrderStatuses.includes(order.status as (typeof terminalOrderStatuses)[number]);
  const openAccount = order.accounts.length === 0 || order.accounts.some((account) => !terminalAccountStatuses.includes(account.accountStatus as (typeof terminalAccountStatuses)[number]));
  return paid && !terminalOrder && openAccount;
}

orderRouter.post(
  "/",
  validateBody(orderSchema),
  asyncHandler(async (req, res) => {
    const challenge = await prisma.challenge.findUnique({ where: { id: req.body.challengeId } });
    if (!challenge || !challenge.isActive) throw new HttpError(404, "Challenge not available");

    const existingOrders = await prisma.order.findMany({
      where: {
        userId: req.user!.id,
        status: { notIn: [...terminalOrderStatuses] },
        OR: [{ status: "PAID" }, { payments: { some: { status: "SUCCEEDED" } } }]
      },
      include: {
        payments: { select: { status: true } },
        accounts: { select: { accountStatus: true } }
      }
    });
    if (existingOrders.some(hasOpenChallengeOrder)) {
      throw new HttpError(409, "Complete or expire your current challenge before buying another challenge.");
    }

    const coupon = req.body.couponCode
      ? await prisma.coupon.findUnique({ where: { code: req.body.couponCode.toUpperCase() } })
      : null;
    const amount = Number(challenge.price);
    if (req.body.couponCode && !coupon) throw new HttpError(400, "Coupon code does not exist");
    if (coupon && coupon.category !== "CHALLENGE" && coupon.category !== "ALL") throw new HttpError(400, "Coupon code is not valid for challenge purchases");
    const couponUsable =
      coupon?.isActive &&
      (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
      (!coupon.maxUses || coupon.usedCount < coupon.maxUses);
    if (coupon && !couponUsable) throw new HttpError(400, "Coupon code is not active or has reached its usage limit");
    const discount = couponUsable
      ? coupon.discountType === "PERCENTAGE"
        ? amount * (Number(coupon.value) / 100)
        : Number(coupon.value)
      : 0;

    const total = Math.max(0, amount - discount);
    if (req.body.paymentMethod !== "TOPUP_BALANCE" && req.body.paymentMethod !== "CRYPTO") {
      throw new HttpError(400, "Bank and card challenge gateways are not enabled yet. Please use top-up balance or crypto.");
    }

    if (req.body.paymentMethod === "TOPUP_BALANCE") {
      const topUpBalance = await getTopUpBalance(req.user!.id);
      if (topUpBalance < total) {
        throw new HttpError(400, `Top-up balance is too low. Available balance is $${topUpBalance.toFixed(2)}.`);
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber: makeOrderNumber(),
          userId: req.user!.id,
          challengeId: challenge.id,
          couponId: couponUsable ? coupon!.id : undefined,
          amount,
          discount,
          total,
          status: req.body.paymentMethod === "TOPUP_BALANCE" ? "PAID" : "PENDING"
        },
        include: { challenge: true, coupon: true }
      });

      if (req.body.paymentMethod === "TOPUP_BALANCE") {
        await tx.payment.create({
          data: {
            userId: req.user!.id,
            orderId: createdOrder.id,
            provider: "topup-wallet",
            amount: total,
            status: "SUCCEEDED",
            metadata: { source: "topup_balance" }
          }
        });
      }

      if (couponUsable && req.body.paymentMethod === "TOPUP_BALANCE") {
        await tx.coupon.update({ where: { id: coupon!.id }, data: { usedCount: { increment: 1 } } });
      }

      return createdOrder;
    });

    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: req.body.paymentMethod === "TOPUP_BALANCE" ? "Challenge purchased" : "Crypto payment started",
        message:
          req.body.paymentMethod === "TOPUP_BALANCE"
            ? `${challenge.name} was purchased with your top-up balance.`
            : `${challenge.name} crypto checkout is waiting for payment.`,
        type: "CHALLENGE"
      }
    });
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true, email: true } });
    if (user) {
      void sendSecurityOtpEmail({
        user,
        action: "challenge purchase",
        details: `${challenge.name} ${req.body.paymentMethod === "TOPUP_BALANCE" ? "purchased" : "checkout started"} for $${total.toFixed(2)}.`
      }).catch((error) => console.error("Challenge purchase OTP email failed:", error));
    }

    if (req.body.paymentMethod === "CRYPTO") {
      try {
        const nowPayment = await createNowPayment({
          orderNumber: order.orderNumber,
          description: `${challenge.name} challenge purchase`,
          amount: total
        });
        const payment = await prisma.payment.create({
          data: {
            userId: req.user!.id,
            orderId: order.id,
            provider: "nowpayments",
            providerPaymentId: String(nowPayment.payment_id),
            amount: total,
            status: "PENDING",
            metadata: nowPayment as object
          }
        });

        sendSuccess(
          res,
          {
            order,
            payment,
            checkout: {
              provider: "nowpayments",
              paymentId: String(nowPayment.payment_id),
              status: nowPayment.payment_status ?? "waiting",
              payAddress: nowPayment.pay_address,
              payAmount: nowPayment.pay_amount,
              payCurrency: nowPayment.pay_currency,
              priceAmount: nowPayment.price_amount ?? total,
              priceCurrency: nowPayment.price_currency ?? "usd"
            }
          },
          201
        );
        return;
      } catch (error) {
        await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
        throw new HttpError(502, error instanceof Error ? error.message : "Crypto checkout could not be created");
      }
    }

    sendSuccess(res, { order }, 201);
  })
);

orderRouter.get(
  "/my",
  asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      include: { challenge: true, payments: true },
      orderBy: { createdAt: "desc" }
    });
    sendSuccess(res, { orders });
  })
);

export const adminOrderRouter = Router();
adminOrderRouter.use(authenticate, requireRole("ADMIN", "SUPER_ADMIN"));

const orderStatusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "CANCELLED", "FAILED", "REFUNDED"])
});

adminOrderRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const orders = await prisma.order.findMany({
      include: { user: true, challenge: true, payments: true },
      orderBy: { createdAt: "desc" }
    });
    sendSuccess(res, { orders });
  })
);

adminOrderRouter.put(
  "/:id/status",
  validateBody(orderStatusSchema),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
      include: { user: true, challenge: true, payments: true }
    });

    await prisma.notification.create({
      data: {
        userId: order.userId,
        title: "Challenge order updated",
        message: `${order.challenge.name} order is now ${order.status.toLowerCase()}.`,
        type: "CHALLENGE"
      }
    });

    sendSuccess(res, { order, message: "Order status updated" });
  })
);
