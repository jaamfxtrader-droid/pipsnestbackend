import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validate.js";
import { sendEmail } from "../services/email.service.js";
import { asyncHandler, sendSuccess } from "../utils/http.js";

const CONTACT_FROM = "PipNest Markets <contact@pipnestmarkets.com>";
const CONTACT_TO = "contact@pipnestmarkets.com";
const LOGO_URL = "https://pipnestmarkets.com/logo-icon.png";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(5000)
});

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function brandedEmail({
  title,
  eyebrow,
  body,
  cta
}: {
  title: string;
  eyebrow: string;
  body: string;
  cta?: string;
}) {
  const safeTitle = escapeHtml(title);
  const safeEyebrow = escapeHtml(eyebrow);
  const safeBody = escapeHtml(body).replace(/\n/g, "<br />");
  const safeCta = cta ? escapeHtml(cta) : "";

  return `
    <div style="margin:0;padding:32px;background:#f4f8ff;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dbe7ff;border-radius:18px;overflow:hidden;box-shadow:0 24px 70px rgba(37,99,235,0.14);">
        <div style="padding:30px;background:#061126;color:#ffffff;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:22px;">
            <tr>
              <td style="vertical-align:middle;">
                <img src="${LOGO_URL}" width="48" height="48" alt="PipNest Markets" style="display:block;border-radius:12px;background:#ffffff;" />
              </td>
              <td style="vertical-align:middle;text-align:right;">
                <div style="font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#93c5fd;">${safeEyebrow}</div>
              </td>
            </tr>
          </table>
          <h1 style="margin:14px 0 0;font-size:28px;line-height:1.25;">${safeTitle}</h1>
        </div>
        <div style="padding:30px;">
          <p style="margin:0;font-size:15px;line-height:1.8;color:#475569;">${safeBody}</p>
          ${
            safeCta
              ? `<div style="margin-top:24px;padding:16px;border-radius:14px;background:#eef5ff;border:1px solid #bfdbfe;color:#1d4ed8;font-weight:700;">${safeCta}</div>`
              : ""
          }
          <p style="margin:26px 0 0;font-size:13px;line-height:1.7;color:#64748b;">PipNest Markets support replies from contact@pipnestmarkets.com.</p>
        </div>
      </div>
    </div>
  `;
}

export const contactRouter = Router();

contactRouter.post(
  "/",
  validateBody(contactSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof contactSchema>;
    const ticketRef = `PNM-${Date.now().toString(36).toUpperCase()}`;

    const teamText = `New contact form submission\n\nReference: ${ticketRef}\nName: ${input.name}\nEmail: ${input.email}\nSubject: ${input.subject}\n\n${input.message}`;
    const teamHtml = brandedEmail({
      eyebrow: "New contact message",
      title: input.subject,
      body: `Reference: ${ticketRef}\nName: ${input.name}\nEmail: ${input.email}\n\n${input.message}`,
      cta: "Reply directly to this email to contact the sender."
    });

    await sendEmail({
      from: CONTACT_FROM,
      replyTo: input.email,
      to: CONTACT_TO,
      subject: `Contact form: ${input.subject}`,
      text: teamText,
      html: teamHtml
    });

    const userText = `Hi ${input.name},\n\nThanks for contacting PipNest Markets. We received your message and our support team will reply from contact@pipnestmarkets.com.\n\nReference: ${ticketRef}\nSubject: ${input.subject}\n\nRegards,\nPipNest Markets Support`;
    const userHtml = brandedEmail({
      eyebrow: "PipNest Markets",
      title: "We received your message",
      body: `Hi ${input.name},\n\nThanks for contacting PipNest Markets. We received your message and our support team will reply from contact@pipnestmarkets.com.\n\nReference: ${ticketRef}\nSubject: ${input.subject}`,
      cta: "Our team usually reviews support messages as quickly as possible."
    });

    await sendEmail({
      from: CONTACT_FROM,
      replyTo: CONTACT_TO,
      to: input.email,
      subject: "We received your message | PipNest Markets",
      text: userText,
      html: userHtml
    });

    sendSuccess(res, { message: "Message sent successfully. Please check your email for confirmation." }, 201);
  })
);
