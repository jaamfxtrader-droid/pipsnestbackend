import { Router } from "express";
import { z } from "zod";
import { assignTradingAccountSchema, tradingAccountApplicationSchema, tradingAccountCredentialSchema, tradingAccountManualStatsSchema } from "@pipnest/shared";
import { prisma } from "../config/prisma.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { sendEmail } from "../services/email.service.js";
import { mt4Service } from "../services/mt4.service.js";
import { mt5Service } from "../services/mt5.service.js";
import { HttpError, asyncHandler, sendSuccess } from "../utils/http.js";

const syncSchema = z.object({
  accountId: z.string().min(1)
});
const EMAIL_LOGO_URL = "https://pipnestmarkets.com/logo-icon.png";

function serviceFor(platform: "MT4" | "MT5") {
  return platform === "MT4" ? mt4Service : mt5Service;
}

function makePendingLogin(platform: "MT4" | "MT5") {
  return `PN-${platform}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

type ChallengeStage = "PHASE_1" | "PHASE_2" | "FUNDED";

function stageLabel(stage: ChallengeStage) {
  if (stage === "PHASE_1") return "Phase 1";
  if (stage === "PHASE_2") return "Phase 2";
  return "Real account";
}

function firstStageFor(phaseCount: number): ChallengeStage {
  return phaseCount <= 0 ? "FUNDED" : "PHASE_1";
}

function allowedStagesFor(phaseCount: number): ChallengeStage[] {
  if (phaseCount <= 0) return ["FUNDED"];
  if (phaseCount === 1) return ["PHASE_1", "FUNDED"];
  return ["PHASE_1", "PHASE_2", "FUNDED"];
}

function previousStageFor(stage: ChallengeStage, phaseCount: number): ChallengeStage | null {
  if (!allowedStagesFor(phaseCount).includes(stage)) return null;
  if (stage === "PHASE_1") return null;
  if (stage === "PHASE_2") return "PHASE_1";
  if (phaseCount <= 0) return null;
  return phaseCount >= 2 ? "PHASE_2" : "PHASE_1";
}

function isFirstStage(stage: ChallengeStage, phaseCount: number) {
  return stage === firstStageFor(phaseCount);
}

async function sendTradingCredentialsEmail({
  email,
  name,
  challengeName,
  stage,
  platform,
  login,
  server,
  password,
  investorPassword,
  serverLink
}: {
  email: string;
  name: string;
  challengeName: string;
  stage: ChallengeStage;
  platform: "MT4" | "MT5";
  login: string;
  server: string;
  password?: string | null;
  investorPassword?: string | null;
  serverLink?: string | null;
}) {
  const rows = [
    ["Challenge", challengeName],
    ["Stage", stageLabel(stage)],
    ["Platform", platform],
    ["Login / server number", login],
    ["Server", server],
    ["Password", password || "Contact support"],
    ["Investor password", investorPassword || "Not provided"],
    ["Server link", serverLink || "Not provided"]
  ];
  const text = [
    `Hi ${name},`,
    "",
    `Your ${platform} ${stageLabel(stage)} server has been approved for ${challengeName}.`,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Keep these credentials private. If you did not request this, contact support."
  ].join("\n");
  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:10px 12px;color:#64748b;font-weight:700;">${label}</td><td style="padding:10px 12px;color:#0f172a;font-weight:800;">${value}</td></tr>`
    )
    .join("");

  await sendEmail({
    to: email,
    subject: `Your ${platform} ${stageLabel(stage)} server is approved`,
    text,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:28px;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
          <div style="padding:24px;background:#0f172a;color:#ffffff;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:18px;">
              <tr>
                <td><img src="${EMAIL_LOGO_URL}" width="48" height="48" alt="PipNest Markets" style="display:block;border-radius:12px;background:#ffffff;" /></td>
                <td style="text-align:right;font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#93c5fd;">PipNest Markets</td>
              </tr>
            </table>
            <h1 style="margin:0;font-size:22px;">Trading server approved</h1>
            <p style="margin:8px 0 0;color:#cbd5e1;">${challengeName} / ${stageLabel(stage)}</p>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 16px;color:#334155;">Hi ${name}, your ${platform} server credentials are ready.</p>
            <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:10px;overflow:hidden;">${htmlRows}</table>
            <p style="margin:18px 0 0;color:#64748b;font-size:13px;">Keep these credentials private. If you did not request this, contact support.</p>
          </div>
        </div>
      </div>
    `
  });
}

function calculateProgress({
  accountSize,
  equity,
  profitTargetPercent
}: {
  accountSize: number;
  equity: number;
  profitTargetPercent: number;
}) {
  const profit = equity - accountSize;
  const targetProfit = accountSize * (profitTargetPercent / 100);
  return targetProfit > 0 ? Math.max(0, Math.round((profit / targetProfit) * 10000) / 100) : 0;
}

export const tradingAccountRouter = Router();
tradingAccountRouter.use(authenticate);

tradingAccountRouter.get(
  "/my",
  asyncHandler(async (req, res) => {
    const accounts = await prisma.tradingAccount.findMany({
      where: { userId: req.user!.id },
      include: {
        challenge: true,
        order: true,
        stats: { orderBy: { recordedAt: "desc" }, take: 12 }
      },
      orderBy: { createdAt: "desc" }
    });
    sendSuccess(res, { accounts });
  })
);

tradingAccountRouter.post(
  "/sync",
  validateBody(syncSchema),
  asyncHandler(async (req, res) => {
    const account = await prisma.tradingAccount.findFirst({
      where: req.user!.role === "ADMIN" ? { id: req.body.accountId } : { id: req.body.accountId, userId: req.user!.id },
      include: { challenge: true }
    });
    if (!account) throw new HttpError(404, "Trading account not found");
    if (account.accountStatus !== "ACTIVE") throw new HttpError(400, "Trading account is not active yet");

    const mtService = serviceFor(account.platform);
    const result = await mtService.syncTradingAccount(account.login, Number(account.challenge.accountSize));

    const stats = await prisma.tradingStats.create({
      data: {
        tradingAccountId: account.id,
        balance: result.stats.balance,
        equity: result.stats.equity,
        profit: result.stats.profit,
        dailyDrawdown: result.stats.dailyDrawdown,
        maxDrawdown: result.stats.maxDrawdown,
        profitTargetProgress: result.stats.profitTargetProgress,
        openTrades: result.openTrades.length,
        closedTrades: result.closedTrades.length
      }
    });

    await prisma.tradingAccount.update({
      where: { id: account.id },
      data: { balance: result.stats.balance, equity: result.stats.equity }
    });

    sendSuccess(res, { stats, openTrades: result.openTrades, closedTrades: result.closedTrades });
  })
);

tradingAccountRouter.post(
  "/apply",
  validateBody(tradingAccountApplicationSchema),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findFirst({
      where: {
        id: req.body.orderId,
        userId: req.user!.id,
        OR: [{ status: "PAID" }, { payments: { some: { status: "SUCCEEDED" } } }]
      },
      include: {
        challenge: true,
        accounts: true
      }
    });
    if (!order) throw new HttpError(403, "Buy a challenge first before applying for a trading account");

    const requestedPlatforms = [...new Set(req.body.platforms)] as Array<"MT4" | "MT5">;
    const stage = req.body.stage as ChallengeStage;
    const phaseCount = Number(order.challenge.phaseCount);
    if (!allowedStagesFor(phaseCount).includes(stage)) {
      throw new HttpError(400, `This challenge does not support ${stageLabel(stage)} requests.`);
    }

    const alreadyAppliedForStage = order.accounts.some((account) => account.stage === stage);
    if (alreadyAppliedForStage) {
      throw new HttpError(409, `You already applied for ${stageLabel(stage)} on this challenge.`);
    }

    const previousStage = previousStageFor(stage, phaseCount);
    if (!previousStage && !isFirstStage(stage, phaseCount)) {
      throw new HttpError(403, `Complete the previous stage before applying for ${stageLabel(stage)}.`);
    }

    if (previousStage && !order.accounts.some((account) => account.stage === previousStage && account.accountStatus === "PASSED")) {
      throw new HttpError(403, `Complete ${stageLabel(previousStage)} before applying for ${stageLabel(stage)}.`);
    }

    const platformsToCreate = requestedPlatforms;

    const accounts = await prisma.$transaction(
      platformsToCreate.map((platform) =>
        prisma.tradingAccount.create({
          data: {
            userId: req.user!.id,
            challengeId: order.challengeId,
            orderId: order.id,
            stage,
            platform,
            login: makePendingLogin(platform),
            server: "Pending assignment",
            serverLink: null,
            balance: 0,
            equity: 0,
            accountStatus: "PENDING"
          },
          include: { challenge: true, order: true, stats: true }
        })
      )
    );

    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: "Trading account application received",
        message: `${stageLabel(stage)} ${platformsToCreate.join(" and ")} account request is pending approval. Typical approval time is 4-5 hours.`,
        type: "CHALLENGE"
      }
    });

    sendSuccess(res, { accounts, message: `${stageLabel(stage)} account request submitted. Approval usually takes 4-5 hours.` }, 201);
  })
);

export const adminTradingAccountRouter = Router();
adminTradingAccountRouter.use(authenticate, requireRole("ADMIN", "SUPER_ADMIN"));

adminTradingAccountRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const accounts = await prisma.tradingAccount.findMany({
      include: { user: true, challenge: true, order: true, stats: { orderBy: { recordedAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" }
    });
    sendSuccess(res, { accounts });
  })
);

adminTradingAccountRouter.post(
  "/assign",
  validateBody(assignTradingAccountSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.body.userId } });
    const challenge = await prisma.challenge.findUnique({ where: { id: req.body.challengeId } });
    if (!user || !challenge) throw new HttpError(404, "User or challenge not found");

    const mtService = serviceFor(req.body.platform);
    const demoAccount = await mtService.assignTradingAccount({
      userId: user.id,
      challengeId: challenge.id,
      login: req.body.login,
      server: req.body.server,
      accountSize: Number(challenge.accountSize)
    });

    const account = await prisma.tradingAccount.create({
      data: {
        userId: user.id,
        challengeId: challenge.id,
        orderId: req.body.orderId,
        platform: req.body.platform,
        login: demoAccount.login,
        password: req.body.password ?? demoAccount.password,
        investorPassword: req.body.investorPassword ?? demoAccount.investorPassword,
        server: demoAccount.server,
        serverLink: req.body.serverLink || null,
        balance: demoAccount.balance,
        equity: demoAccount.equity,
        accountStatus: "ACTIVE",
        stats: {
          create: {
            balance: demoAccount.balance,
            equity: demoAccount.equity,
            profit: Number(demoAccount.equity) - Number(demoAccount.balance),
            dailyDrawdown: 0,
            maxDrawdown: 0,
            profitTargetProgress: 0
          }
        }
      },
      include: { user: true, challenge: true, stats: true }
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Trading account assigned",
        message: `${account.platform} account ${account.login} is now active.`,
        type: "CHALLENGE"
      }
    });

    sendSuccess(res, { account }, 201);
  })
);

adminTradingAccountRouter.put(
  "/:id/credentials",
  validateBody(tradingAccountCredentialSchema),
  asyncHandler(async (req, res) => {
    const account = await prisma.tradingAccount.findUnique({
      where: { id: req.params.id },
      include: { user: true, challenge: true, stats: true }
    });
    if (!account) throw new HttpError(404, "Trading account not found");

    const previousLogin = account.login;
    const previousServer = account.server;
    const startingBalance = Number(account.balance) > 0 ? Number(account.balance) : Number(account.challenge.accountSize);
    const updatedAccount = await prisma.tradingAccount.update({
      where: { id: account.id },
      data: {
        login: req.body.login,
        server: req.body.server,
        serverLink: req.body.serverLink || null,
        password: req.body.password,
        investorPassword: req.body.investorPassword || null,
        balance: startingBalance,
        equity: startingBalance,
        accountStatus: "ACTIVE",
        assignedAt: new Date(),
        statusReason: null,
        disabledAt: null,
        expiredAt: null,
        failedAt: null,
        stats: account.stats.length
          ? undefined
          : {
              create: {
                balance: startingBalance,
                equity: startingBalance,
                profit: 0,
                dailyDrawdown: 0,
                maxDrawdown: 0,
                profitTargetProgress: 0
              }
            }
      },
      include: { user: true, challenge: true, order: true, stats: { orderBy: { recordedAt: "desc" }, take: 1 } }
    });

    await Promise.all([
      prisma.notification.create({
        data: {
          userId: account.userId,
          title: account.accountStatus === "PENDING" ? "Trading account approved" : "Trading account credentials updated",
          message: `${updatedAccount.platform} ${stageLabel(updatedAccount.stage)} account ${updatedAccount.login} is active. Server credentials are available in Trading Accounts.`,
          type: "SUCCESS"
        }
      }),
      sendTradingCredentialsEmail({
        email: updatedAccount.user.email,
        name: updatedAccount.user.name,
        challengeName: updatedAccount.challenge.name,
        stage: updatedAccount.stage,
        platform: updatedAccount.platform,
        login: updatedAccount.login,
        server: updatedAccount.server,
        password: updatedAccount.password,
        investorPassword: updatedAccount.investorPassword,
        serverLink: updatedAccount.serverLink
      })
    ]);

    sendSuccess(res, {
      account: updatedAccount,
      message:
        previousLogin !== updatedAccount.login || previousServer !== updatedAccount.server
          ? "Trading account server updated and credentials emailed"
          : "Trading account approved and credentials emailed"
    });
  })
);

adminTradingAccountRouter.put(
  "/:id/manual-stats",
  validateBody(tradingAccountManualStatsSchema),
  asyncHandler(async (req, res) => {
    const account = await prisma.tradingAccount.findUnique({
      where: { id: req.params.id },
      include: { user: true, challenge: true, order: true, stats: { orderBy: { recordedAt: "desc" }, take: 1 } }
    });
    if (!account) throw new HttpError(404, "Trading account not found");
    if (account.accountStatus === "PENDING") {
      throw new HttpError(400, "Approve and assign server credentials before updating manual trading stats");
    }

    const accountSize = Number(account.challenge.accountSize);
    const latestStats = account.stats[0];
    const balance = Number(req.body.balance ?? latestStats?.balance ?? account.balance ?? accountSize);
    const equity = Number(req.body.equity ?? latestStats?.equity ?? account.equity ?? accountSize);
    const dailyDrawdown = Number(req.body.dailyDrawdown ?? latestStats?.dailyDrawdown ?? 0);
    const maxDrawdown = Number(req.body.maxDrawdown ?? latestStats?.maxDrawdown ?? 0);
    const openTrades = Number(req.body.openTrades ?? latestStats?.openTrades ?? 0);
    const closedTrades = Number(req.body.closedTrades ?? latestStats?.closedTrades ?? 0);
    const profit = equity - accountSize;
    const progress = calculateProgress({
      accountSize,
      equity,
      profitTargetPercent: account.challenge.profitTargetPercent
    });
    const dailyLimitHit = dailyDrawdown >= account.challenge.dailyDrawdownPercent;
    const maxLimitHit = maxDrawdown >= account.challenge.maxDrawdownPercent;
    const equityLimitHit = equity <= accountSize * (1 - account.challenge.maxDrawdownPercent / 100);
    const targetHit = progress >= 100;

    let nextStatus = req.body.status ?? account.accountStatus;
    let statusReason = req.body.note?.trim() || null;
    if (dailyLimitHit || maxLimitHit || equityLimitHit) {
      nextStatus = "FAILED";
      statusReason =
        statusReason ||
        (dailyLimitHit
          ? "Daily drawdown limit reached"
          : maxLimitHit
            ? "Maximum drawdown limit reached"
            : "Equity liquidation limit reached");
    } else if (targetHit && (!req.body.status || req.body.status === "ACTIVE")) {
      nextStatus = "PASSED";
      statusReason = statusReason || `${stageLabel(account.stage)} profit target achieved`;
    }

    const now = new Date();
    const stats = await prisma.tradingStats.create({
      data: {
        tradingAccountId: account.id,
        balance,
        equity,
        profit,
        dailyDrawdown,
        maxDrawdown,
        profitTargetProgress: progress,
        openTrades,
        closedTrades
      }
    });

    const isPassed = nextStatus === "PASSED";
    const isFailed = nextStatus === "FAILED";
    const isDisabled = nextStatus === "FAILED" || nextStatus === "SUSPENDED";
    const isOpenStatus = nextStatus === "ACTIVE" || nextStatus === "PENDING";

    const updatedAccount = await prisma.tradingAccount.update({
      where: { id: account.id },
      data: {
        balance,
        equity,
        accountStatus: nextStatus,
        statusReason,
        completedAt: isPassed ? now : isOpenStatus ? null : account.completedAt,
        passedAt: isPassed ? now : isOpenStatus ? null : account.passedAt,
        failedAt: isFailed ? now : isOpenStatus || isPassed ? null : account.failedAt,
        disabledAt: isDisabled ? now : isOpenStatus || isPassed ? null : account.disabledAt,
        expiredAt: isFailed ? now : isOpenStatus || isPassed ? null : account.expiredAt
      },
      include: { user: true, challenge: true, order: true, stats: { orderBy: { recordedAt: "desc" }, take: 1 } }
    });

    if (updatedAccount.accountStatus !== account.accountStatus || statusReason) {
      await prisma.notification.create({
        data: {
          userId: account.userId,
          title:
            updatedAccount.accountStatus === "PASSED"
              ? `${stageLabel(updatedAccount.stage)} completed`
              : updatedAccount.accountStatus === "FAILED"
                ? "Challenge account failed"
                : "Trading account updated",
          message:
            updatedAccount.accountStatus === "PASSED"
              ? `${updatedAccount.challenge.name} ${stageLabel(updatedAccount.stage)} is complete. Apply for the next stage from Trading Accounts.`
              : updatedAccount.accountStatus === "FAILED"
                ? `${updatedAccount.challenge.name} account has expired. ${statusReason ?? "Challenge limits were reached."}`
                : statusReason ?? `${updatedAccount.challenge.name} account status is now ${updatedAccount.accountStatus.toLowerCase()}.`,
          type: updatedAccount.accountStatus === "FAILED" ? "ERROR" : updatedAccount.accountStatus === "PASSED" ? "SUCCESS" : "CHALLENGE"
        }
      });
    }

    sendSuccess(res, {
      account: updatedAccount,
      stats,
      message:
        updatedAccount.accountStatus === "FAILED"
          ? "Account updated and disabled after limit breach"
          : updatedAccount.accountStatus === "PASSED"
            ? "Account updated and marked passed"
            : "Manual trading stats updated"
    });
  })
);
