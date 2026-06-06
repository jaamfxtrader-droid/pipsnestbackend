import dns from "node:dns";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";
import { env } from "../config/env.js";

type MailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
};

type SmtpOptionsWithFamily = SMTPTransport.Options & {
  family: 4;
};

type ResendErrorResponse = {
  name?: string;
  message?: string;
  statusCode?: number;
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

async function sendWithResend(input: MailInput) {
  const from = input.from ?? env.RESEND_FROM ?? env.MAIL_FROM ?? env.SMTP_USER;

  if (!env.RESEND_API_KEY || !from) {
    console.warn("Resend is not configured. Skipping email:", input.subject);
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: input.to,
        reply_to: input.replyTo,
        subject: input.subject,
        html: input.html,
        text: input.text
      })
    });

    if (response.ok) return true;

    const error = (await response.json().catch(() => ({}))) as ResendErrorResponse;
    console.error(
      `Failed to send email "${input.subject}" to ${input.to} via Resend: status=${response.status} message=${
        error.message ?? response.statusText
      }`
    );
    return false;
  } catch (error) {
    console.error(`Failed to send email "${input.subject}" to ${input.to} via Resend: ${getSmtpErrorDetails(error)}`);
    return false;
  }
}

async function sendWithSmtp(input: MailInput) {
  const host = env.SMTP_HOST;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  const from = input.from ?? env.MAIL_FROM ?? user;

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
      replyTo: input.replyTo,
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

export async function sendEmail(input: MailInput) {
  if (env.RESEND_API_KEY) return sendWithResend(input);
  return sendWithSmtp(input);
}
