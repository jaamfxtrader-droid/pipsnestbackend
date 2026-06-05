import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler, sendSuccess } from "../utils/http.js";

export const notificationRouter = Router();
notificationRouter.use(authenticate);

notificationRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const archived = req.query.archived === "true";
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id, archivedAt: archived ? { not: null } : null },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    sendSuccess(res, { notifications });
  })
);

notificationRouter.put(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: { isRead: true }
    });
    sendSuccess(res, { notification });
  })
);

notificationRouter.put(
  "/mark-all-read",
  asyncHandler(async (req, res) => {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user!.id, archivedAt: null, isRead: false },
      data: { isRead: true }
    });
    sendSuccess(res, { count: result.count });
  })
);

notificationRouter.put(
  "/:id/unarchive",
  asyncHandler(async (req, res) => {
    const result = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: { archivedAt: null }
    });
    sendSuccess(res, { count: result.count });
  })
);

notificationRouter.put(
  "/:id/archive",
  asyncHandler(async (req, res) => {
    const result = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: { archivedAt: new Date(), isRead: true }
    });
    sendSuccess(res, { count: result.count });
  })
);
