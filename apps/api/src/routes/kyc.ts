import { kycStatuses, kycSubmissionSchema } from "@pipnest/shared";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { uploadKycDocument } from "../services/cloudinary.service.js";
import { HttpError, asyncHandler, sendSuccess } from "../utils/http.js";

export const kycRouter = Router();
kycRouter.use(authenticate);

kycRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, phone: true }
    });
    const kyc = await prisma.kycSubmission.findFirst({
      where: { userId: req.user!.id },
      orderBy: { submittedAt: "desc" }
    });

    sendSuccess(res, { user, phone: user.phone, kyc });
  })
);

kycRouter.post(
  "/",
  validateBody(kycSubmissionSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
      select: { id: true, name: true, phone: true }
    });
    if (!user.phone) throw new HttpError(400, "Add a phone number to your profile before submitting KYC");

    const latest = await prisma.kycSubmission.findFirst({
      where: { userId: user.id },
      orderBy: { submittedAt: "desc" }
    });
    if (latest?.status === "PENDING") throw new HttpError(409, "Your KYC submission is already under review");
    if (latest?.status === "APPROVED") throw new HttpError(409, "Your KYC is already approved");

    const [documentFrontUrl, documentBackUrl] = await Promise.all([
      uploadKycDocument(req.body.documentFrontUrl),
      uploadKycDocument(req.body.documentBackUrl)
    ]);

    const kyc = await prisma.kycSubmission.create({
      data: {
        userId: user.id,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        middleName: req.body.middleName?.trim() || null,
        phone: user.phone,
        address: req.body.address,
        documentType: req.body.documentType,
        documentFrontUrl,
        documentBackUrl,
        acceptedPolicies: req.body.acceptedPolicies,
        status: "PENDING"
      }
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "KYC submitted",
        message: "Your identity verification is under review. Approval usually takes 24-72 hours.",
        type: "INFO"
      }
    });

    sendSuccess(res, { kyc, message: "KYC submitted successfully. Review usually takes 24-72 hours." }, 201);
  })
);

const adminKycStatusSchema = z.object({
  status: z.enum(kycStatuses),
  adminNote: z.string().trim().max(500).optional().or(z.literal(""))
});

export const adminKycRouter = Router();
adminKycRouter.use(authenticate, requireRole("ADMIN", "SUPER_ADMIN"));

adminKycRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const submissions = await prisma.kycSubmission.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            phone: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { submittedAt: "desc" }
    });

    sendSuccess(res, { submissions });
  })
);

adminKycRouter.put(
  "/:id/status",
  validateBody(adminKycStatusSchema),
  asyncHandler(async (req, res) => {
    const kyc = await prisma.kycSubmission.update({
      where: { id: req.params.id },
      data: {
        status: req.body.status,
        adminNote: req.body.adminNote?.trim() || null,
        reviewedAt: req.body.status === "PENDING" ? null : new Date()
      }
    });

    await prisma.notification.create({
      data: {
        userId: kyc.userId,
        title: req.body.status === "APPROVED" ? "KYC approved" : req.body.status === "REJECTED" ? "KYC rejected" : "KYC status updated",
        message:
          req.body.status === "APPROVED"
            ? "Your identity verification has been approved."
            : req.body.status === "REJECTED"
              ? "Your identity verification was rejected. Please review the note and submit again."
              : "Your identity verification has been moved back to review.",
        type: req.body.status === "APPROVED" ? "SUCCESS" : req.body.status === "REJECTED" ? "WARNING" : "INFO"
      }
    });

    sendSuccess(res, { kyc, message: "KYC status updated" });
  })
);
