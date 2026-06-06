import { sendEmail } from "./email.service.js";

const TRANSACTION_FROM = "PipNest Markets Transactions <transaction@pipnestmarkets.com>";
const LOGO_URL = "https://pipnestmarkets.com/logo-icon.png";

type ReceiptRow = {
  label: string;
  value: string;
};

type TransactionEmailInput = {
  to: string;
  name: string;
  subject: string;
  title: string;
  intro: string;
  statusLabel: string;
  amount?: string;
  rows: ReceiptRow[];
  footerNote?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderRows(rows: ReceiptRow[]) {
  return rows
    .map(
      (row) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">${escapeHtml(row.label)}</td>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:13px;font-weight:700;text-align:right;">${escapeHtml(row.value)}</td>
        </tr>
      `
    )
    .join("");
}

function renderText(input: TransactionEmailInput) {
  const rows = input.rows.map((row) => `${row.label}: ${row.value}`).join("\n");
  return `${input.title}\n\nHi ${input.name || "Trader"},\n${input.intro}\n\nStatus: ${input.statusLabel}${
    input.amount ? `\nAmount: ${input.amount}` : ""
  }\n${rows}\n\n${input.footerNote ?? "This is an automated transaction email from PipNest Markets."}`;
}

export async function sendTransactionEmail(input: TransactionEmailInput) {
  const safeName = escapeHtml(input.name || "Trader");
  const safeTitle = escapeHtml(input.title);
  const safeIntro = escapeHtml(input.intro);
  const safeStatus = escapeHtml(input.statusLabel);
  const safeAmount = input.amount ? escapeHtml(input.amount) : "";
  const safeFooter = escapeHtml(input.footerNote ?? "This is an automated transaction email from PipNest Markets.");

  const html = `
    <div style="margin:0;padding:34px;background:#f4f8ff;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:660px;margin:0 auto;background:#ffffff;border:1px solid #dbe7ff;border-radius:18px;overflow:hidden;box-shadow:0 24px 70px rgba(37,99,235,0.14);">
        <div style="padding:28px 30px;background:#061126;color:#ffffff;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            <tr>
              <td style="vertical-align:middle;">
                <img src="${LOGO_URL}" width="48" height="48" alt="PipNest Markets" style="display:block;border-radius:12px;background:#ffffff;" />
              </td>
              <td style="vertical-align:middle;text-align:right;">
                <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#93c5fd;">PipNest Markets</div>
                <div style="margin-top:6px;font-size:13px;color:#dbeafe;">Transaction Receipt</div>
              </td>
            </tr>
          </table>
          <h1 style="margin:24px 0 0;font-size:28px;line-height:1.25;">${safeTitle}</h1>
        </div>
        <div style="padding:30px;">
          <p style="margin:0 0 14px;font-size:16px;line-height:1.7;">Hi ${safeName},</p>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.75;color:#475569;">${safeIntro}</p>
          <div style="margin:0 0 22px;padding:18px;border-radius:14px;background:#eef5ff;border:1px solid #bfdbfe;">
            <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#2563eb;">Status</div>
            <div style="margin-top:8px;font-size:22px;font-weight:900;color:#0f172a;">${safeStatus}</div>
            ${
              safeAmount
                ? `<div style="margin-top:12px;font-size:30px;line-height:1;font-weight:900;color:#15803d;">${safeAmount}</div>`
                : ""
            }
          </div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            ${renderRows(input.rows)}
          </table>
          <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#64748b;">${safeFooter}</p>
          <p style="margin:12px 0 0;font-size:12px;line-height:1.7;color:#94a3b8;">Sent by transaction@pipnestmarkets.com</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    from: TRANSACTION_FROM,
    replyTo: "transaction@pipnestmarkets.com",
    to: input.to,
    subject: input.subject,
    html,
    text: renderText(input)
  });
}

export function money(value: unknown, currency = "USD") {
  const amount = Number(value ?? 0);
  return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
}
