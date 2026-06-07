import { manualFundingAccountSchema, topUpRequestSchema } from "@pipnest/shared";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { uploadManualFundingAccountImage, uploadTopUpProof } from "../services/cloudinary.service.js";
import { createNowPayment } from "../services/nowpayments.service.js";
import { money, sendTransactionEmail } from "../services/transaction-email.service.js";
import { buildTopUpOverview, getTopUpBalance } from "../services/topup.service.js";
import { HttpError, asyncHandler, sendSuccess } from "../utils/http.js";

export const topUpRouter = Router();
topUpRouter.use(authenticate);

const topUpCryptoCheckoutSchema = z.object({
  amount: z.coerce.number().positive("Top-up amount must be greater than zero")
});

topUpRouter.get(
  "/overview",
  asyncHandler(async (req, res) => {
    const overview = await buildTopUpOverview(req.user!.id);
    sendSuccess(res, overview);
  })
);

topUpRouter.get(
  "/manual-accounts",
  asyncHandler(async (_req, res) => {
    const accounts = await prisma.manualFundingAccount.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });
    sendSuccess(res, { accounts, approvalWindow: accounts[0]?.processingTime ?? "12-24 hours" });
  })
);

topUpRouter.post(
  "/request",
  validateBody(topUpRequestSchema),
  asyncHandler(async (req, res) => {
    if (req.body.method !== "MANUAL") {
      throw new HttpError(400, "Bank, crypto, and card top-up gateways are not enabled yet. Please use manual top-up for now.");
    }

    const manualAccount = await prisma.manualFundingAccount.findUnique({ where: { id: req.body.manualFundingAccountId } });
    if (!manualAccount || !manualAccount.isActive) {
      throw new HttpError(400, "Select an active manual funding account");
    }
    if (Number(req.body.amount) < Number(manualAccount.minAmount)) {
      throw new HttpError(400, `Minimum amount for ${manualAccount.label} is $${Number(manualAccount.minAmount).toFixed(2)}.`);
    }
    const approvalWindow = manualAccount.processingTime || "12-24 hours";

    const existingTransaction = await prisma.topUpTransaction.findFirst({
      where: {
        manualFundingAccountId: manualAccount.id,
        transactionId: req.body.transactionId.trim()
      }
    });
    if (existingTransaction) {
      throw new HttpError(409, "This transaction ID has already been submitted for the selected funding account");
    }

    const proofUrl = await uploadTopUpProof(req.body.proofUrl);
    const topUp = await prisma.topUpTransaction.create({
      data: {
        userId: req.user!.id,
        manualFundingAccountId: manualAccount.id,
        amount: req.body.amount,
        method: req.body.method,
        reference: req.body.reference?.trim() || manualAccount.label,
        transactionId: req.body.transactionId.trim(),
        proofUrl,
        status: "PENDING"
      },
      include: { manualFundingAccount: true }
    });

    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: "Top-up request submitted",
        message: `Your manual top-up request is pending admin approval. Estimated approval time is ${approvalWindow}.`,
        type: "INFO"
      }
    });
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true, email: true } });
    if (user) {
      void sendTransactionEmail({
        to: user.email,
        name: user.name,
        subject: `Top-up request received | PipNest Markets`,
        title: "Top-up request received",
        intro: "Your manual top-up request has been submitted and is pending admin approval.",
        statusLabel: "Pending approval",
        amount: money(req.body.amount),
        rows: [
          { label: "Top-up reference", value: topUp.reference ?? topUp.id },
          { label: "Funding account", value: manualAccount.label },
          { label: "Transaction ID", value: topUp.transactionId ?? "Submitted" },
          { label: "Estimated approval", value: approvalWindow }
        ],
        footerNote: "Your top-up balance updates after admin approval."
      }).catch((error) => console.error("Top-up request email failed:", error));
    }

    sendSuccess(res, { topUp, message: `Manual top-up request submitted. Balance will update after admin approval within ${approvalWindow}.` }, 201);
  })
);

topUpRouter.post(
  "/crypto-checkout",
  validateBody(topUpCryptoCheckoutSchema),
  asyncHandler(async (req, res) => {
    const amount = Number(req.body.amount);
    const topUp = await prisma.topUpTransaction.create({
      data: {
        userId: req.user!.id,
        amount,
        method: "CRYPTO",
        reference: "NOWPayments crypto top-up",
        transactionId: `crypto-${Date.now()}`,
        status: "PENDING"
      }
    });

    try {
      const nowPayment = await createNowPayment({
        orderNumber: `topup-${topUp.id}`,
        description: "PipNest Markets top-up balance",
        amount
      });
      const payment = await prisma.payment.create({
        data: {
          userId: req.user!.id,
          provider: "nowpayments-topup",
          providerPaymentId: String(nowPayment.payment_id),
          amount,
          status: "PENDING",
          metadata: { ...(nowPayment as object), topUpId: topUp.id, checkoutType: "topup" }
        }
      });

      await prisma.notification.create({
        data: {
          userId: req.user!.id,
          title: "Crypto top-up started",
          message: "Your crypto top-up checkout is waiting for payment confirmation.",
          type: "INFO"
        }
      });

      sendSuccess(
        res,
        {
          topUp,
          payment,
          checkout: {
            provider: "nowpayments",
            paymentId: String(nowPayment.payment_id),
            status: nowPayment.payment_status ?? "waiting",
            payAddress: nowPayment.pay_address,
            payAmount: nowPayment.pay_amount,
            payCurrency: nowPayment.pay_currency,
            priceAmount: nowPayment.price_amount ?? amount,
            priceCurrency: nowPayment.price_currency ?? "usd",
            topUp
          }
        },
        201
      );
    } catch (error) {
      await prisma.topUpTransaction.update({
        where: { id: topUp.id },
        data: { status: "REJECTED", adminNote: "Crypto checkout could not be created", processedAt: new Date() }
      });
      throw new HttpError(502, error instanceof Error ? error.message : "Crypto checkout could not be created");
    }
  })
);

topUpRouter.get(
  "/crypto/pending",
  asyncHandler(async (req, res) => {
    const payment = await prisma.payment.findFirst({
      where: { userId: req.user!.id, provider: "nowpayments-topup", status: "PENDING" },
      orderBy: { createdAt: "desc" }
    });
    if (!payment) {
      sendSuccess(res, { checkout: null });
      return;
    }

    const metadata = (payment.metadata as Record<string, unknown> | null) ?? {};
    const topUpId = typeof metadata.topUpId === "string" ? metadata.topUpId : null;
    const topUp = topUpId ? await prisma.topUpTransaction.findUnique({ where: { id: topUpId } }) : null;
    if (!topUp || topUp.status !== "PENDING") {
      sendSuccess(res, { checkout: null });
      return;
    }

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
        topUp
      }
    });
  })
);

const topUpStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  adminNote: z.string().trim().max(500).optional().or(z.literal(""))
});

export const adminTopUpRouter = Router();
adminTopUpRouter.use(authenticate, requireRole("ADMIN", "SUPER_ADMIN"));

adminTopUpRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const topUps = await prisma.topUpTransaction.findMany({
      include: {
        manualFundingAccount: true,
        user: {
          select: { id: true, name: true, email: true, username: true, phone: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    sendSuccess(res, { topUps });
  })
);

adminTopUpRouter.get(
  "/manual-accounts",
  asyncHandler(async (_req, res) => {
    const accounts = await prisma.manualFundingAccount.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });
    sendSuccess(res, { accounts });
  })
);

adminTopUpRouter.post(
  "/manual-accounts",
  validateBody(manualFundingAccountSchema),
  asyncHandler(async (req, res) => {
    const imageUrl = await uploadManualFundingAccountImage(req.body.imageUrl);
    const account = await prisma.manualFundingAccount.create({
      data: {
        label: req.body.label,
        accountType: req.body.accountType,
        asset: req.body.asset?.trim() || null,
        network: req.body.network?.trim() || null,
        accountIdentifier: req.body.accountIdentifier,
        holderName: req.body.holderName?.trim() || null,
        instructions: req.body.instructions?.trim() || null,
        imageUrl,
        processingTime: req.body.processingTime?.trim() || null,
        minAmount: req.body.minAmount,
        isActive: req.body.isActive,
        sortOrder: req.body.sortOrder
      }
    });
    sendSuccess(res, { account }, 201);
  })
);

adminTopUpRouter.put(
  "/manual-accounts/:id",
  validateBody(manualFundingAccountSchema),
  asyncHandler(async (req, res) => {
    const imageUrl = await uploadManualFundingAccountImage(req.body.imageUrl);
    const account = await prisma.manualFundingAccount.update({
      where: { id: req.params.id },
      data: {
        label: req.body.label,
        accountType: req.body.accountType,
        asset: req.body.asset?.trim() || null,
        network: req.body.network?.trim() || null,
        accountIdentifier: req.body.accountIdentifier,
        holderName: req.body.holderName?.trim() || null,
        instructions: req.body.instructions?.trim() || null,
        imageUrl,
        processingTime: req.body.processingTime?.trim() || null,
        minAmount: req.body.minAmount,
        isActive: req.body.isActive,
        sortOrder: req.body.sortOrder
      }
    });
    sendSuccess(res, { account });
  })
);

adminTopUpRouter.delete(
  "/manual-accounts/:id",
  asyncHandler(async (req, res) => {
    const account = await prisma.manualFundingAccount.findUnique({ where: { id: req.params.id } });
    if (!account) throw new HttpError(404, "Manual funding account not found");

    await prisma.$transaction([
      prisma.topUpTransaction.updateMany({ where: { manualFundingAccountId: account.id }, data: { manualFundingAccountId: null } }),
      prisma.manualFundingAccount.delete({ where: { id: account.id } })
    ]);
    sendSuccess(res, { message: "Manual funding account deleted" });
  })
);

adminTopUpRouter.put(
  "/:id/status",
  validateBody(topUpStatusSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.topUpTransaction.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Top-up request not found");

    if (existing.status === "APPROVED" && req.body.status !== "APPROVED") {
      const balance = await getTopUpBalance(existing.userId);
      if (balance < Number(existing.amount)) {
        throw new HttpError(400, "This approved top-up has already been used. It cannot be moved back to pending or rejected without creating a negative balance.");
      }
    }

    const topUp = await prisma.topUpTransaction.update({
      where: { id: req.params.id },
      data: {
        status: req.body.status,
        adminNote: req.body.adminNote?.trim() || null,
        processedAt: req.body.status === "APPROVED" || req.body.status === "REJECTED" ? new Date() : null
      },
      include: { manualFundingAccount: true, user: true }
    });

    await prisma.notification.create({
      data: {
        userId: topUp.userId,
        title: req.body.status === "APPROVED" ? "Top-up approved" : req.body.status === "REJECTED" ? "Top-up rejected" : "Top-up status updated",
        message:
          req.body.status === "APPROVED"
            ? "Your top-up balance has been credited."
            : req.body.status === "REJECTED"
              ? "Your manual top-up was rejected. Please review the admin note."
              : `Your top-up request is now ${req.body.status.toLowerCase()}.`,
        type: req.body.status === "APPROVED" ? "SUCCESS" : req.body.status === "REJECTED" ? "WARNING" : "INFO"
      }
    });

    void sendTransactionEmail({
      to: topUp.user.email,
      name: topUp.user.name,
      subject: `Top-up ${topUp.status.toLowerCase()} | PipNest Markets`,
      title: req.body.status === "APPROVED" ? "Top-up credited" : req.body.status === "REJECTED" ? "Top-up rejected" : "Top-up status updated",
      intro:
        req.body.status === "APPROVED"
          ? "Your top-up has been approved and credited to your dashboard balance."
          : req.body.status === "REJECTED"
            ? "Your top-up request was reviewed and rejected."
            : "Your top-up request status has been updated.",
      statusLabel: topUp.status,
      amount: money(topUp.amount),
      rows: [
        { label: "Top-up reference", value: topUp.reference ?? topUp.id },
        { label: "Funding account", value: topUp.manualFundingAccount?.label ?? "Manual funding" },
        { label: "Transaction ID", value: topUp.transactionId ?? "Not provided" },
        { label: "Processed at", value: topUp.processedAt?.toISOString() ?? new Date().toISOString() },
        ...(topUp.adminNote ? [{ label: "Admin note", value: topUp.adminNote }] : [])
      ],
      footerNote: req.body.status === "APPROVED" ? "Your credited balance can now be used for eligible challenge purchases." : undefined
    }).catch((error) => console.error("Top-up status email failed:", error));

    sendSuccess(res, { topUp, message: "Top-up status updated" });
  })
);
