import { Router } from "express";
import { z } from "zod";
import { supportTicketSchema, ticketReplySchema } from "@pipnest/shared";
import { prisma } from "../config/prisma.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { uploadSupportAttachments } from "../services/cloudinary.service.js";
import { publishSupportEvent } from "../services/support-live.service.js";
import { HttpError, asyncHandler, sendSuccess } from "../utils/http.js";

const ticketStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"])
});

const ticketAssignSchema = z.object({
  assignedAdminId: z.string().min(1).nullable()
});

function isStaffRole(role: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export const supportRouter = Router();
supportRouter.use(authenticate);

supportRouter.post(
  "/tickets",
  validateBody(supportTicketSchema),
  asyncHandler(async (req, res) => {
    const attachments = await uploadSupportAttachments(req.body.attachments);
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.user!.id,
        subject: req.body.subject,
        category: req.body.category,
        priority: req.body.priority,
        messages: {
          create: {
            senderId: req.user!.id,
            message: req.body.message,
            isStaff: isStaffRole(req.user!.role),
            attachments
          }
        }
      },
      include: { messages: { include: { sender: true }, orderBy: { createdAt: "asc" } } }
    });
    publishSupportEvent({ ticketId: ticket.id, payload: { type: "ticket.created", ticket } });
    sendSuccess(res, { ticket }, 201);
  })
);

supportRouter.get(
  "/tickets/my",
  asyncHandler(async (req, res) => {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.user!.id },
      include: { messages: { include: { sender: true }, orderBy: { createdAt: "asc" } } },
      orderBy: { updatedAt: "desc" }
    });
    sendSuccess(res, { tickets });
  })
);

supportRouter.post(
  "/tickets/:id/reply",
  validateBody(ticketReplySchema),
  asyncHandler(async (req, res) => {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
    if (!ticket) throw new HttpError(404, "Ticket not found");
    if (ticket.userId !== req.user!.id && !isStaffRole(req.user!.role)) {
      throw new HttpError(403, "You cannot reply to this ticket");
    }
    const attachments = await uploadSupportAttachments(req.body.attachments);

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: req.user!.id,
        message: req.body.message?.trim() || (attachments.length ? "Attachment" : ""),
        isStaff: isStaffRole(req.user!.role),
        attachments
      },
      include: { sender: true }
    });
    await prisma.supportTicket.update({ where: { id: ticket.id }, data: { status: "IN_PROGRESS" } });
    publishSupportEvent({ ticketId: ticket.id, payload: { type: "ticket.message", message } });
    sendSuccess(res, { message }, 201);
  })
);

export const adminSupportRouter = Router();
adminSupportRouter.use(authenticate, requireRole("ADMIN", "SUPER_ADMIN"));

adminSupportRouter.get(
  "/tickets",
  asyncHandler(async (_req, res) => {
    const tickets = await prisma.supportTicket.findMany({
      include: { user: true, messages: { include: { sender: true }, orderBy: { createdAt: "asc" } } },
      orderBy: { updatedAt: "desc" }
    });
    sendSuccess(res, { tickets });
  })
);

adminSupportRouter.put(
  "/tickets/:id/status",
  validateBody(ticketStatusSchema),
  asyncHandler(async (req, res) => {
    const ticket = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { status: req.body.status }
    });
    publishSupportEvent({ ticketId: ticket.id, payload: { type: "ticket.status", ticket } });
    sendSuccess(res, { ticket });
  })
);

adminSupportRouter.put(
  "/tickets/:id/assign",
  validateBody(ticketAssignSchema),
  asyncHandler(async (req, res) => {
    if (req.body.assignedAdminId) {
      const admin = await prisma.user.findFirst({
        where: { id: req.body.assignedAdminId, role: { in: ["ADMIN", "SUPER_ADMIN"] } }
      });
      if (!admin) throw new HttpError(404, "Assigned admin not found");
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: {
        assignedAdminId: req.body.assignedAdminId,
        status: req.body.assignedAdminId ? "IN_PROGRESS" : undefined
      }
    });
    publishSupportEvent({ ticketId: ticket.id, payload: { type: "ticket.assigned", ticket } });
    sendSuccess(res, { ticket });
  })
);
