import { Router } from "express";
import slugify from "slugify";
import { challengeSchema } from "@pipnest/shared";
import { prisma } from "../config/prisma.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { HttpError, asyncHandler, sendSuccess } from "../utils/http.js";

export const challengeRouter = Router();

challengeRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const challenges = await prisma.challenge.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { accountSize: "asc" }]
    });
    sendSuccess(res, { challenges });
  })
);

challengeRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const challenge = await prisma.challenge.findFirst({
      where: {
        OR: [{ id: req.params.id }, { slug: req.params.id }]
      }
    });
    if (!challenge) throw new HttpError(404, "Challenge not found");
    sendSuccess(res, { challenge });
  })
);

export const adminChallengeRouter = Router();
adminChallengeRouter.use(authenticate, requireRole("ADMIN", "SUPER_ADMIN"));

adminChallengeRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const challenges = await prisma.challenge.findMany({
      orderBy: [{ sortOrder: "asc" }, { accountSize: "asc" }, { createdAt: "desc" }]
    });
    sendSuccess(res, { challenges });
  })
);

adminChallengeRouter.post(
  "/",
  validateBody(challengeSchema),
  asyncHandler(async (req, res) => {
    const slug = slugify(req.body.name, { lower: true, strict: true });
    const challenge = await prisma.challenge.create({ data: { ...req.body, slug } });
    sendSuccess(res, { challenge }, 201);
  })
);

adminChallengeRouter.put(
  "/:id",
  validateBody(challengeSchema.partial()),
  asyncHandler(async (req, res) => {
    const data = req.body.name
      ? { ...req.body, slug: slugify(req.body.name, { lower: true, strict: true }) }
      : req.body;
    const challenge = await prisma.challenge.update({ where: { id: req.params.id }, data });
    sendSuccess(res, { challenge });
  })
);

adminChallengeRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const challenge = await prisma.challenge.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { orders: true, tradingAccounts: true } } }
    });
    if (!challenge) throw new HttpError(404, "Challenge not found");

    if (challenge._count.orders > 0 || challenge._count.tradingAccounts > 0) {
      const updated = await prisma.challenge.update({
        where: { id: req.params.id },
        data: { isActive: false }
      });
      sendSuccess(res, { challenge: updated, message: "Challenge has linked records, so it was hidden from user-facing cards." });
      return;
    }

    await prisma.challenge.delete({ where: { id: req.params.id } });
    sendSuccess(res, { message: "Challenge deleted" });
  })
);
