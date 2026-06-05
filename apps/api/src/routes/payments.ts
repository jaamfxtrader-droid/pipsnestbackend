import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
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
