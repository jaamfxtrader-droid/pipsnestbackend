import { prisma } from "../config/prisma.js";

function toMoney(value: unknown) {
  return Number(value ?? 0);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export async function getTopUpBalance(userId: string) {
  const [credits, debits] = await Promise.all([
    prisma.topUpTransaction.aggregate({
      where: { userId, status: "APPROVED" },
      _sum: { amount: true }
    }),
    prisma.payment.aggregate({
      where: { userId, provider: "topup-wallet", status: "SUCCEEDED" },
      _sum: { amount: true }
    })
  ]);

  return roundMoney(toMoney(credits._sum.amount) - toMoney(debits._sum.amount));
}

export async function buildTopUpOverview(userId: string) {
  const [balance, topUps, walletPayments] = await Promise.all([
    getTopUpBalance(userId),
    prisma.topUpTransaction.findMany({
      where: { userId },
      include: { manualFundingAccount: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.payment.findMany({
      where: { userId, provider: "topup-wallet" },
      include: { order: { include: { challenge: true } } },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const pendingAmount = topUps
    .filter((topUp) => topUp.status === "PENDING")
    .reduce((sum, topUp) => sum + toMoney(topUp.amount), 0);
  const approvedAmount = topUps
    .filter((topUp) => topUp.status === "APPROVED")
    .reduce((sum, topUp) => sum + toMoney(topUp.amount), 0);
  const spentAmount = walletPayments
    .filter((payment) => payment.status === "SUCCEEDED")
    .reduce((sum, payment) => sum + toMoney(payment.amount), 0);

  const ledger = [
    ...topUps.map((topUp) => ({
      id: topUp.id,
      reference: topUp.transactionId || topUp.reference || topUp.id,
      type: "Top-up Deposit",
      direction: "CREDIT" as const,
      amount: roundMoney(toMoney(topUp.amount)),
      method: topUp.manualFundingAccount?.label || topUp.method,
      status: topUp.status,
      date: topUp.createdAt.toISOString(),
      receiptUrl: topUp.proofUrl,
      details: topUp.adminNote || topUp.manualFundingAccount?.instructions || "Top-up balance credit request"
    })),
    ...walletPayments.map((payment) => ({
      id: payment.id,
      reference: payment.order?.orderNumber || payment.id,
      type: "Challenge Purchase",
      direction: "DEBIT" as const,
      amount: roundMoney(toMoney(payment.amount)),
      method: "TOPUP_BALANCE",
      status: payment.status,
      date: payment.createdAt.toISOString(),
      receiptUrl: null,
      details: payment.order?.challenge.name || "Challenge purchase"
    }))
  ].sort((left, right) => Date.parse(right.date) - Date.parse(left.date));

  return {
    balance,
    pendingAmount: roundMoney(pendingAmount),
    approvedAmount: roundMoney(approvedAmount),
    spentAmount: roundMoney(spentAmount),
    topUps,
    ledger
  };
}
