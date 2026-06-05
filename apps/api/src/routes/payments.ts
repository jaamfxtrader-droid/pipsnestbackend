import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { getNowPaymentStatus, mapNowPaymentStatus, verifyNowPaymentsSignature } from "../services/nowpayments.service.js";
import { HttpError, asyncHandler, sendSuccess } from "../utils/http.js";

const createPaymentSchema = z.object({
  orderId: z.string().min(1),
  provider: z.string().default("manual-demo")
});

const webhookSchema = z.object({
  paymentId: z.string().optional(),
  orderId: z.string().optional(),
  status: z.enum(["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"])
});

const nowPaymentsWebhookSchema = z.object({
  payment_id: z.union([z.string(), z.number()]).optional(),
  payment_status: z.string().optional(),
  order_id: z.string().optional()
}).passthrough();

export const paymentRouter = Router();

paymentRouter.post(
  "/create",
  authenticate,
  validateBody(createPaymentSchema),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findFirst({
      where: { id: req.body.orderId, userId: req.user!.id }
    });
    if (!order) throw new HttpError(404, "Order not found");

    const payment = await prisma.payment.create({
      data: {
        userId: req.user!.id,
        orderId: order.id,
        provider: req.body.provider,
        amount: order.total,
        status: "PENDING",
        metadata: { checkoutMode: "dummy", androidReady: true }
      }
    });

    sendSuccess(res, {
      payment,
      checkout: {
        clientSecret: `dummy_${payment.id}`,
        message: "Payment provider can be connected here later."
      }
    });
  })
);

paymentRouter.post(
  "/webhook",
  validateBody(webhookSchema),
  asyncHandler(async (req, res) => {
    // Verify PAYMENT_WEBHOOK_SECRET here before trusting real gateway events.
    const { paymentId, orderId, status } = req.body;
    const payment = paymentId
      ? await prisma.payment.update({ where: { id: paymentId }, data: { status } })
      : orderId
        ? await prisma.payment.findFirst({ where: { orderId } })
        : null;

    if (payment?.orderId && status === "SUCCEEDED") {
      await prisma.order.update({ where: { id: payment.orderId }, data: { status: "PAID" } });
    }

    sendSuccess(res, { received: true });
  })
);

async function syncNowPayment(providerPaymentId: string, providerStatus?: string, payload?: unknown) {
  const paymentStatus = mapNowPaymentStatus(providerStatus);
  const existingPayment = await prisma.payment.findFirst({
    where: { provider: "nowpayments", providerPaymentId }
  });
  if (!existingPayment) throw new HttpError(404, "Crypto payment not found");

  const payment = await prisma.payment.update({
    where: { id: existingPayment.id },
    data: {
      status: paymentStatus,
      metadata: payload ? (payload as object) : undefined
    },
    include: { order: true }
  });

  if (payment.orderId) {
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: paymentStatus === "SUCCEEDED" ? "PAID" : paymentStatus === "FAILED" ? "FAILED" : "PENDING" }
    });
  }

  if (payment.orderId && paymentStatus === "SUCCEEDED") {
    await prisma.notification.create({
      data: {
        userId: payment.userId,
        title: "Challenge crypto payment confirmed",
        message: "Your crypto payment was confirmed and the challenge order is now paid.",
        type: "CHALLENGE"
      }
    });
  }

  return payment;
}

paymentRouter.get(
  "/nowpayments/:paymentId/status",
  authenticate,
  asyncHandler(async (req, res) => {
    const payment = await prisma.payment.findFirst({
      where: { provider: "nowpayments", providerPaymentId: req.params.paymentId, userId: req.user!.id },
      include: { order: { include: { challenge: true } } }
    });
    if (!payment) throw new HttpError(404, "Crypto payment not found");

    const status = await getNowPaymentStatus(req.params.paymentId);
    const syncedPayment = await syncNowPayment(req.params.paymentId, status.payment_status, status);
    const updatedOrder = payment.orderId
      ? await prisma.order.findUnique({ where: { id: payment.orderId }, include: { challenge: true, payments: true } })
      : null;

    sendSuccess(res, {
      payment: syncedPayment,
      order: updatedOrder,
      status: status.payment_status,
      mappedStatus: syncedPayment.status
    });
  })
);

paymentRouter.post(
  "/nowpayments/ipn",
  asyncHandler(async (req, res) => {
    if (!verifyNowPaymentsSignature(req.body, req.headers["x-nowpayments-sig"])) {
      throw new HttpError(401, "Invalid NOWPayments signature");
    }

    const payload = nowPaymentsWebhookSchema.parse(req.body);
    const providerPaymentId = payload.payment_id ? String(payload.payment_id) : null;
    if (!providerPaymentId) throw new HttpError(400, "Missing NOWPayments payment id");

    await syncNowPayment(providerPaymentId, payload.payment_status, payload);
    sendSuccess(res, { received: true });
  })
);

export const adminPaymentRouter = Router();
adminPaymentRouter.use(authenticate, requireRole("ADMIN", "SUPER_ADMIN"));

adminPaymentRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const payments = await prisma.payment.findMany({
      include: { user: true, order: { include: { challenge: true } } },
      orderBy: { createdAt: "desc" }
    });
    sendSuccess(res, { payments });
  })
);
