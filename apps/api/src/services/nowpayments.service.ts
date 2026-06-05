import crypto from "node:crypto";
import { env } from "../config/env.js";

type NowPaymentResponse = {
  payment_id: string | number;
  payment_status?: string;
  pay_address?: string;
  price_amount?: number;
  price_currency?: string;
  pay_amount?: number;
  pay_currency?: string;
  order_id?: string;
  order_description?: string;
};

const NOWPAYMENTS_API_BASE = "https://api.nowpayments.io/v1";

function requireApiKey() {
  if (!env.NOWPAYMENTS_API_KEY) throw new Error("NOWPayments API key is not configured");
  return env.NOWPAYMENTS_API_KEY;
}

async function nowPaymentsFetch<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${NOWPAYMENTS_API_BASE}${path}`, {
    ...init,
    headers: {
      "x-api-key": requireApiKey(),
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  const payload = (await response.json().catch(() => ({}))) as T & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message || `NOWPayments request failed with status ${response.status}`);
  }
  return payload;
}

export async function createNowPayment({
  orderNumber,
  description,
  amount
}: {
  orderNumber: string;
  description: string;
  amount: number;
}) {
  return nowPaymentsFetch<NowPaymentResponse>("/payment", {
    method: "POST",
    body: JSON.stringify({
      price_amount: Number(amount.toFixed(2)),
      price_currency: "usd",
      pay_currency: env.NOWPAYMENTS_PAY_CURRENCY,
      ipn_callback_url: env.NOWPAYMENTS_IPN_CALLBACK_URL,
      order_id: orderNumber,
      order_description: description,
      is_fixed_rate: true,
      is_fee_paid_by_user: true
    })
  });
}

export async function getNowPaymentStatus(paymentId: string) {
  return nowPaymentsFetch<NowPaymentResponse>(`/payment/${encodeURIComponent(paymentId)}`);
}

export function mapNowPaymentStatus(status?: string) {
  const normalized = status?.toLowerCase();
  if (normalized === "finished" || normalized === "confirmed") return "SUCCEEDED";
  if (normalized === "failed" || normalized === "expired" || normalized === "refunded") return "FAILED";
  return "PENDING";
}

function sortPayload(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortPayload);
  if (!value || typeof value !== "object") return value;

  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((sorted, key) => {
      sorted[key] = sortPayload((value as Record<string, unknown>)[key]);
      return sorted;
    }, {});
}

export function verifyNowPaymentsSignature(payload: unknown, signature?: string | string[]) {
  if (!env.NOWPAYMENTS_IPN_SECRET) return true;
  if (!signature || Array.isArray(signature)) return false;

  const expected = crypto
    .createHmac("sha512", env.NOWPAYMENTS_IPN_SECRET)
    .update(JSON.stringify(sortPayload(payload)))
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
