import dns from "node:dns";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";
import { env } from "../config/env.js";

type MailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type SmtpOptionsWithFamily = SMTPTransport.Options & {
  family: 4;
};

function normalizeSmtpPassword(host: string, password: string) {
  return host.includes("gmail.com") ? password.replace(/\s+/g, "") : password;
}

function getSmtpErrorDetails(error: unknown) {
  if (!(error instanceof Error)) return String(error);

  const smtpError = error as Error & {
    code?: string;
    command?: string;
    response?: string;
    responseCode?: number;
  };
  const details = [
    error.message,
    smtpError.code ? `code=${smtpError.code}` : "",
    smtpError.command ? `command=${smtpError.command}` : "",
    smtpError.responseCode ? `responseCode=${smtpError.responseCode}` : "",
    smtpError.response ? `response=${smtpError.response}` : ""
  ].filter(Boolean);

  return details.join(" | ") || error.name || "Unknown SMTP error";
}

function getResendErrorDetails(status: number, body: string) {
  try {
    const payload = JSON.parse(body) as { message?: string; error?: string; name?: string };
    return [payload.message, payload.error, payload.name, `status=${status}`].filter(Boolean).join(" | ");
  } catch {
    return `${body || "Unknown Resend error"} | status=${status}`;
  }
}

async function sendWithResend(input: MailInput) {
  const apiKey = env.RESEND_API_KEY;
  const from = env.RESEND_FROM ?? env.MAIL_FROM;

  if (!apiKey || !from) return false;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text
      })
    });

    if (response.ok) return true;

    const body = await response.text();
    console.error(`Failed to send email "${input.subject}" to ${input.to} via Resend: ${getResendErrorDetails(response.status, body)}`);
    return false;
  } catch (error) {
    console.error(`Failed to send email "${input.subject}" to ${input.to} via Resend: ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

export async function sendEmail(input: MailInput) {
  if (env.RESEND_API_KEY) {
    return sendWithResend(input);
  }

  const host = env.SMTP_HOST;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  const from = env.MAIL_FROM ?? user;

  if (!host || !user || !pass || !from) {
    console.warn("SMTP is not configured. Skipping email:", input.subject);
    return false;
  }

  dns.setDefaultResultOrder("ipv4first");

  const transportOptions: SmtpOptionsWithFamily = {
    host,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    family: 4,
    auth: {
      user,
      pass: normalizeSmtpPassword(host, pass)
    },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000
  };

  const transporter = nodemailer.createTransport(transportOptions);

  try {
    await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html
    });
    return true;
  } catch (error) {
    console.error(`Failed to send email "${input.subject}" to ${input.to}: ${getSmtpErrorDetails(error)}`);
    return false;
  } finally {
    transporter.close();
  }
}
