import dns from 'node:dns';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

config({ path: path.resolve(__dirname, '../../.env') });

async function run() {
  dns.setDefaultResultOrder('ipv4first');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE) === 'true',
    family: 4,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000
  });

  try {
    await transporter.verify();
    console.log('SMTP verified');
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: 'Test email from PipNest (SMTP)',
      text: 'This is a test email to verify SMTP settings.'
    });
    console.log('Sent:', info.messageId || info);
  } catch (err) {
    console.error('SMTP error:', err);
    process.exitCode = 1;
  } finally {
    try { transporter.close(); } catch {}
  }
}

run();
