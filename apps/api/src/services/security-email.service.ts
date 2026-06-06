import { randomInt } from "node:crypto";
import { sendEmail } from "./email.service.js";

function generateOtp(length = 6) {
  return Array.from({ length }, () => randomInt(0, 10)).join("");
}

const EMAIL_LOGO_URL = "https://pipnestmarkets.com/logo-icon.png";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendSecurityOtpEmail({
  user,
  action,
  details
}: {
  user: { name: string; email: string };
  action: string;
  details?: string;
}) {
  const code = generateOtp();
  const safeName = escapeHtml(user.name || "Trader");
  const safeAction = escapeHtml(action);
  const safeDetails = details ? escapeHtml(details) : "";
  const html = `
    <div style="margin:0;padding:32px;background:#f4f8ff;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dbe7ff;border-radius:18px;overflow:hidden;">
        <div style="padding:28px 30px;background:#061126;color:#ffffff;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:18px;">
            <tr>
              <td><img src="${EMAIL_LOGO_URL}" width="48" height="48" alt="PipNest Markets" style="display:block;border-radius:12px;background:#ffffff;" /></td>
              <td style="text-align:right;font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#93c5fd;">PipNest Markets</td>
            </tr>
          </table>
          <h1 style="margin:14px 0 0;font-size:26px;line-height:1.25;">${safeAction} OTP</h1>
        </div>
        <div style="padding:30px;">
          <p style="margin:0 0 14px;font-size:16px;line-height:1.7;">Hi ${safeName},</p>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">Security OTP for ${safeAction}.</p>
          ${
            safeDetails
              ? `<p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569;">${safeDetails}</p>`
              : ""
          }
          <div style="margin:0 0 24px;padding:18px;border-radius:14px;background:#eef5ff;text-align:center;border:1px solid #bfdbfe;">
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#2563eb;">Your OTP</div>
            <div style="margin-top:8px;font-size:36px;font-weight:800;letter-spacing:10px;color:#0f172a;">${code}</div>
          </div>
          <p style="margin:0;font-size:14px;line-height:1.7;color:#64748b;">If this was not you, secure your account and contact support.</p>
        </div>
      </div>
    </div>
  `;
  const text = `${action} OTP\n\nHi ${user.name || "Trader"},\nSecurity OTP for ${action}.${details ? `\n\n${details}` : ""}\n\nYour OTP: ${code}\n\nIf this was not you, secure your account and contact support.`;

  return sendEmail({
    to: user.email,
    subject: `Your PipNest Markets ${action} OTP`,
    html,
    text
  });
}
