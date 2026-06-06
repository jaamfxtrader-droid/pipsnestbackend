import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { getNowPaymentStatus, mapNowPaymentStatus, verifyNowPaymentsSignature } from "../services/nowpayments.service.js";
import { money, sendTransactionEmail } from "../services/transaction-email.service.js";
import { HttpError, asyncHandler, sendSuccess } from "../utils/http.js";

const createPaymentSchema = z.object({
  orderId: z.string().min(1),
  provider: z.string().default("manual")
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
        metadata: { checkoutMode: "manual", androidReady: true }
      }
    });

    sendSuccess(res, {
      payment,
      checkout: {
        clientSecret: `manual_${payment.id}`,
        message: "Your payment request has been created. Please follow the payment instructions in your dashboard."
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
    where: { provider: "nowpayments", providerPaymentId },
    include: { user: true, order: { include: { challenge: true } } }
  });
  if (!existingPayment) throw new HttpError(404, "Crypto payment not found");
  const shouldSendInvoice = existingPayment.status !== "SUCCEEDED" && paymentStatus === "SUCCEEDED";

  const payment = await prisma.payment.update({
    where: { id: existingPayment.id },
    data: {
      status: paymentStatus,
      metadata: payload ? (payload as object) : undefined
    },
    include: { user: true, order: { include: { challenge: true } } }
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

  if (shouldSendInvoice && payment.order) {
    void sendTransactionEmail({
      to: payment.user.email,
      name: payment.user.name,
      subject: `Crypto payment invoice ${payment.order.orderNumber} | PipNest Markets`,
      title: "Crypto payment confirmed",
      intro: "Your crypto payment was confirmed and your challenge order has been marked paid.",
      statusLabel: "Paid",
      amount: money(payment.amount, payment.currency),
      rows: [
        { label: "Order number", value: payment.order.orderNumber },
        { label: "Challenge", value: payment.order.challenge.name },
        { label: "Payment provider", value: "NOWPayments" },
        { label: "Provider payment ID", value: payment.providerPaymentId ?? providerPaymentId },
        { label: "Confirmed at", value: new Date().toISOString() }
      ],
      footerNote: "This invoice was sent after crypto payment confirmation."
    }).catch((error) => console.error("Crypto invoice email failed:", error));
  }

  return payment;
}

paymentRouter.get(
  "/nowpayments/pending",
  authenticate,
  asyncHandler(async (req, res) => {
    const payment = await prisma.payment.findFirst({
      where: {
        userId: req.user!.id,
        provider: "nowpayments",
        status: "PENDING",
        order: { status: "PENDING" }
      },
      include: { order: { include: { challenge: true, payments: true } } },
      orderBy: { createdAt: "desc" }
    });

    if (!payment?.order) {
      sendSuccess(res, { checkout: null });
      return;
    }

    const metadata = (payment.metadata as Record<string, unknown> | null) ?? {};
    sendSuccess(res, {
      checkout: {
        provider: "nowpayments",
        paymentId: payment.providerPaymentId,
        status: String(metadata.payment_status ?? payment.status),
        payAddress: typeof metadata.pay_address === "string" ? metadata.pay_address : undefined,
        payAmount: typeof metadata.pay_amount === "number" ? metadata.pay_amount : undefined,
        payCurrency: typeof metadata.pay_currency === "string" ? metadata.pay_currency : undefined,
        priceAmount: typeof metadata.price_amount === "number" ? metadata.price_amount : Number(payment.amount),
        priceCurrency: typeof metadata.price_currency === "string" ? metadata.price_currency : payment.currency.toLowerCase(),
        order: payment.order
      }
    });
  })
);

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
  "/nowpayments/:paymentId/cancel",
  authenticate,
  asyncHandler(async (req, res) => {
    const payment = await prisma.payment.findFirst({
      where: { provider: "nowpayments", providerPaymentId: req.params.paymentId, userId: req.user!.id },
      include: { order: { include: { challenge: true } } }
    });
    if (!payment) throw new HttpError(404, "Crypto payment not found");
    if (payment.status === "SUCCEEDED" || payment.order?.status === "PAID") {
      throw new HttpError(409, "Confirmed crypto payments cannot be cancelled.");
    }

    let providerStatus: Awaited<ReturnType<typeof getNowPaymentStatus>> | null = null;
    try {
      providerStatus = await getNowPaymentStatus(req.params.paymentId);
      const mappedProviderStatus = mapNowPaymentStatus(providerStatus.payment_status);
      if (mappedProviderStatus === "SUCCEEDED") {
        await syncNowPayment(req.params.paymentId, providerStatus.payment_status, providerStatus);
        throw new HttpError(409, "This crypto payment has already been confirmed and cannot be cancelled.");
      }
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.warn(`NOWPayments status check failed before cancel: ${error instanceof Error ? error.message : String(error)}`);
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        metadata: {
          ...((payment.metadata as Record<string, unknown> | null) ?? {}),
          providerStatusAtCancel: providerStatus?.payment_status ?? null,
          cancelledByUser: true,
          cancelledAt: new Date().toISOString()
        }
      }
    });

    const updatedOrder = payment.orderId
      ? await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: "CANCELLED" },
          include: { challenge: true, payments: true }
        })
      : null;

    if (payment.order) {
      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: "Crypto checkout cancelled",
          message: `${payment.order.challenge.name} crypto checkout was cancelled. No invoice will be sent unless a payment is later confirmed by the provider.`,
          type: "CHALLENGE"
        }
      });
    }

    sendSuccess(res, {
      payment: updatedPayment,
      order: updatedOrder,
      message: "Crypto checkout cancelled"
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
