import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Pipnest@123", 12);
  const superAdminPasswordHash = await bcrypt.hash("123456", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@pipnestfunding.com" },
    update: {
      name: "Hash24 Super Admin",
      username: "hash24",
      passwordHash: superAdminPasswordHash,
      role: "SUPER_ADMIN",
      emailVerified: true,
      isActive: true
    },
    create: {
      name: "Hash24 Super Admin",
      email: "admin@pipnestfunding.com",
      username: "hash24",
      passwordHash: superAdminPasswordHash,
      role: "SUPER_ADMIN",
      emailVerified: true,
      referralCode: "PIPNESTADMIN"
    }
  });

  await prisma.admin.upsert({
    where: { userId: admin.id },
    update: {
      permissions: ["admin:all", "cms:all"]
    },
    create: {
      userId: admin.id,
      permissions: ["admin:all", "cms:all"]
    }
  });

  await Promise.all(
    [
      { name: "Super Admin", permissions: ["admin:all", "cms:all"] },
      { name: "CMS Manager", permissions: ["cms:all"] },
      { name: "Support Pages", permissions: ["page:contact", "page:faq"] }
    ].map((role) =>
      prisma.adminRoleTemplate.upsert({
        where: { name: role.name },
        update: { permissions: role.permissions, locked: true },
        create: { ...role, locked: true }
      })
    )
  );

  const trader = await prisma.user.upsert({
    where: { email: "trader@pipnestfunding.com" },
    update: {},
    create: {
      name: "Demo Trader",
      email: "trader@pipnestfunding.com",
      passwordHash,
      emailVerified: true,
      referralCode: "DEMO2026"
    }
  });

  const challenges = await Promise.all(
    [
      {
        name: "Starter Challenge",
        slug: "starter-challenge",
        description: "A focused evaluation for traders building consistency on a $10,000 simulated account.",
        accountSize: 10000,
        price: 89,
        profitTargetPercent: 8,
        dailyDrawdownPercent: 5,
        maxDrawdownPercent: 10,
        minTradingDays: 5,
        leverage: "1:100",
        phaseCount: 2,
        sortOrder: 1
      },
      {
        name: "Growth Challenge",
        slug: "growth-challenge",
        description: "Our most popular $50,000 simulated funding track with balanced objectives.",
        accountSize: 50000,
        price: 299,
        profitTargetPercent: 8,
        dailyDrawdownPercent: 5,
        maxDrawdownPercent: 10,
        minTradingDays: 5,
        leverage: "1:100",
        phaseCount: 2,
        sortOrder: 2
      },
      {
        name: "Elite Challenge",
        slug: "elite-challenge",
        description: "A premium $100,000 simulated account evaluation for experienced traders.",
        accountSize: 100000,
        price: 499,
        profitTargetPercent: 10,
        dailyDrawdownPercent: 4,
        maxDrawdownPercent: 8,
        minTradingDays: 7,
        leverage: "1:100",
        phaseCount: 2,
        sortOrder: 3
      }
    ].map((challenge) =>
      prisma.challenge.upsert({
        where: { slug: challenge.slug },
        update: challenge,
        create: challenge
      })
    )
  );

  const coupon = await prisma.coupon.upsert({
    where: { code: "LAUNCH15" },
    update: {},
    create: {
      code: "LAUNCH15",
      description: "Launch discount for demo purchases",
      discountType: "PERCENTAGE",
      value: 15,
      maxUses: 500
    }
  });

  const order = await prisma.order.upsert({
    where: { orderNumber: "PNF-10001" },
    update: {},
    create: {
      orderNumber: "PNF-10001",
      userId: trader.id,
      challengeId: challenges[1].id,
      couponId: coupon.id,
      amount: 299,
      discount: 44.85,
      total: 254.15,
      status: "PAID"
    }
  });

  const payment = await prisma.payment.findFirst({ where: { orderId: order.id, provider: "manual-demo" } });
  if (!payment) {
    await prisma.payment.create({
      data: {
        userId: trader.id,
        orderId: order.id,
        provider: "manual-demo",
        providerPaymentId: "demo-pay-10001",
        amount: 254.15,
        status: "SUCCEEDED",
        metadata: { mode: "seed", note: "Dummy payment for local demo" }
      }
    });
  }

  const account = await prisma.tradingAccount.upsert({
    where: { login: "90050123" },
    update: {},
    create: {
      userId: trader.id,
      challengeId: challenges[1].id,
      orderId: order.id,
      platform: "MT5",
      login: "90050123",
      password: "demo-master",
      investorPassword: "demo-investor",
      server: "Pipnest-Demo",
      balance: 50000,
      equity: 52840,
      accountStatus: "ACTIVE"
    }
  });

  if ((await prisma.tradingStats.count({ where: { tradingAccountId: account.id } })) === 0) {
    await prisma.tradingStats.createMany({
      data: [
        {
          tradingAccountId: account.id,
          balance: 50000,
          equity: 50620,
          profit: 620,
          dailyDrawdown: 1.2,
          maxDrawdown: 2.1,
          profitTargetProgress: 15.5,
          openTrades: 2,
          closedTrades: 14
        },
        {
          tradingAccountId: account.id,
          balance: 50000,
          equity: 52840,
          profit: 2840,
          dailyDrawdown: 0.8,
          maxDrawdown: 2.8,
          profitTargetProgress: 71,
          openTrades: 1,
          closedTrades: 27
        }
      ]
    });
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: trader.id,
      subject: "Account credentials confirmation",
      category: "Trading Account",
      priority: "MEDIUM",
      messages: {
        create: {
          senderId: trader.id,
          message: "Can you confirm my demo account server details?",
          isStaff: false
        }
      }
    }
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      senderId: admin.id,
      message: "Your demo account is connected to Pipnest-Demo. Real MT4/MT5 provisioning will be connected through the service layer later.",
      isStaff: true
    }
  });

  await prisma.payoutRequest.create({
    data: {
      userId: trader.id,
      tradingAccountId: account.id,
      amount: 850,
      method: "Bank Transfer",
      bankDetails: "Demo bank payout details",
      status: "PENDING"
    }
  });

  await prisma.affiliateReferral.upsert({
    where: {
      referrerId_referredUserId: {
        referrerId: admin.id,
        referredUserId: trader.id
      }
    },
    update: {},
    create: {
      referrerId: admin.id,
      referredUserId: trader.id,
      commissionRate: 10,
      commissionAmount: 25.42,
      status: "ACTIVE",
      convertedAt: new Date()
    }
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: trader.id,
        title: "Challenge account assigned",
        message: "Your Growth Challenge MT5 demo account is ready.",
        type: "CHALLENGE"
      },
      {
        userId: trader.id,
        title: "Payout request received",
        message: "Your demo payout request is pending admin review.",
        type: "PAYOUT"
      }
    ]
  });

  const pages = [
    [
      "home",
      "Turn your trading skills into income",
      "Join a modern prop firm experience with challenge tracking, payouts, affiliate tools, and MT4/MT5-ready infrastructure."
    ],
    [
      "about",
      "Built for disciplined traders and lean prop firm operations.",
      "PipNest Markets is structured as a production-ready prop firm platform with clean separation between public marketing, trader workflows, admin operations, and future trading server integrations."
    ],
    [
      "funding-programs",
      "Choose the simulated capital track that fits your process.",
      "All programs are seeded into Prisma and exposed through the challenge API."
    ],
    [
      "challenge-details",
      "Clear evaluation objectives with dashboard tracking.",
      "Profit target, drawdown, minimum day, and account status rules remain visible throughout the trader journey."
    ],
    [
      "how-it-works",
      "A complete funding workflow from account to payout.",
      "Register, purchase a challenge, trade within the rules, and request payouts from the dashboard."
    ],
    [
      "payouts",
      "Request, review, approve, and track payouts.",
      "Trader payout requests flow through admin review with status tracking and clear payout history."
    ],
    [
      "affiliate",
      "Referral tracking and commission reporting are built in.",
      "Every user gets a referral code while the API tracks referred users, conversion status, commission rate, and payout-ready amounts."
    ],
    [
      "contact",
      "Talk to Pipnest support.",
      "Use the support ticket system inside the dashboard for account requests, or reach out through the contact form for general inquiries."
    ],
    ["faq", "Common platform questions.", "Answers for funding, account assignment, coupons, affiliates, and future MT4/MT5 integrations."],
    [
      "terms",
      "Terms & Conditions",
      "PipNest Markets provides simulated trading challenges and dashboard tooling. Final legal terms should be reviewed by counsel before production launch."
    ],
    [
      "privacy",
      "Privacy Policy",
      "The platform stores account, order, support, notification, and affiliate data in PostgreSQL through Prisma. Secrets must remain server-side and environment-based."
    ],
    [
      "risk-disclosure",
      "Risk Disclosure",
      "Trading involves risk. PipNest Markets challenge screens use simulated accounts and dummy MT4/MT5 statistics until a real Manager API integration is connected."
    ],
    [
      "refund-policy",
      "Refund Policy",
      "Refund rules should be configured according to business policy. The schema includes order and payment statuses needed to track paid, failed, cancelled, and refunded states."
    ]
  ] as const;

  await Promise.all(
    pages.map(([slug, title, content]) =>
      prisma.cmsPage.upsert({
        where: { slug },
        update: {},
        create: {
          slug,
          title,
          content,
          updatedById: admin.id
        }
      })
    )
  );

  const sectionSeeds = [
    ["home", "hero", "Hero Banner", "PipNest Markets", "Turn your trading skills into income", "Join a modern prop firm experience with challenge tracking, payouts, affiliate tools, and MT4/MT5-ready infrastructure.", "Get Funded", "/funding-programs", 1],
    ["home", "preview", "Terminal Preview", "Trade with peace of mind", "Pipnest terminal preview", "Dummy account analytics are ready today, while MT4/MT5 Manager API can be connected from the backend service layer later.", null, null, 2],
    ["home", "how", "How It Works", "How it works", "Start in three simple steps", "Pick a challenge, follow the rules, and scale simulated firm capital from your dashboard.", null, null, 3],
    ["home", "rank", "Rank Up", "Rank Up", "Your journey starts here", "Choose one-step or two-step evaluation paths with clear objectives and visible progress.", null, null, 4],
    ["home", "journey", "Trader Journey", "Trader's Journey", "Track each milestone from challenge to payout", "Keep every stage visible, from purchase to funded status and payout requests.", null, null, 5],
    ["home", "rewards", "Rewards", null, "Real traders, real rewards, real impact", "Highlight payouts, top allocations, fastest cycles, and simulated capital milestones.", null, null, 6],
    ["home", "trade", "Trade Platforms", "Trade on your terms", "Choose your platform and keep your rules visible", "Show MT4/MT5 readiness, coupon flows, and affiliate tools in one brand section.", "Start Trading", "/funding-programs", 7],
    ["home", "capital", "Capital", "Your skill is our capital", "Get evaluated, get backed, and manage everything in one place", "Use challenge cards, payout cards, and secure trader workflows to keep operations clean.", null, null, 8],
    ["home", "story", "Story", null, "Built by traders, for traders. Your growth is our mission.", "Use this block later for founder video, testimonials, or a brand story section.", null, null, 9],
    ["home", "dashboard", "Dashboard CTA", "Trader dashboard", "Local access and convenience with modern workflows", "The admin console controls users, accounts, payments, payouts, support, coupons, affiliates, CMS, and reports.", "Explore Dashboard", "/dashboard", 10],
    ["home", "mobile", "Mobile", "Meet Trader", "Android-ready API structure for mobile apps", "The backend is JSON-first, role-protected, and ready to power Android screens for auth, challenges, accounts, payouts, tickets, affiliates, and notifications.", "Android API Ready", "/dashboard", 11],
    ["home", "final", "Final CTA", "Building Traders Globally Since 2022", "A complete prop firm platform under one roof", "Ready for launch content and production integrations.", "Start your challenge", "/auth/register", 12],
    ["about", "intro", "Intro", "About Us", "Built for disciplined traders and lean prop firm operations.", "PipNest Markets is structured as a production-ready prop firm platform with clean separation between public marketing, trader workflows, admin operations, and future trading server integrations.", null, null, 1],
    ["about", "features", "Feature Cards", null, "Transparent operations for traders and admins", "Transparent rules, admin controls, and integration-ready services can be shaped from the CMS.", null, null, 2],
    ["funding-programs", "intro", "Intro", "Funding Programs", "Choose the simulated capital track that fits your process.", "All programs are seeded into Prisma and exposed through the challenge API.", null, null, 1],
    ["challenge-details", "intro", "Intro", "Challenge Details", "Clear evaluation objectives with dashboard tracking.", "Profit target, drawdown, minimum day, and account status rules remain visible throughout the trader journey.", null, null, 1],
    ["challenge-details", "rules", "Rules Table", null, "Rules traders can understand quickly", "Control the supporting rules section copy from the CMS while challenge values continue to come from platform data.", null, null, 2],
    ["how-it-works", "intro", "Intro", "How It Works", "A complete funding workflow from account to payout.", "Register, purchase a challenge, trade within the rules, and request payouts from the dashboard.", null, null, 1],
    ["how-it-works", "steps", "Steps", null, "Four clear steps from signup to scale", "Edit the heading and supporting copy around the operational steps from the CMS.", null, null, 2],
    ["payouts", "intro", "Intro", "Payouts", "Request, review, approve, and track payouts.", "Trader payout requests flow through admin review with status tracking and clear payout history.", null, null, 1],
    ["payouts", "workflow", "Workflow", null, "A clean payout review workflow", "Explain payout submission, review, approval, and paid states from the CMS.", null, null, 2],
    ["affiliate", "intro", "Intro", "Affiliate Program", "Referral tracking and commission reporting are built in.", "Every user gets a referral code while the API tracks referred users, conversion status, commission rate, and payout-ready amounts.", "Become an Affiliate", "/dashboard/affiliate", 1],
    ["affiliate", "link", "Referral Link", null, "Demo referral link", "Control helper copy for the referral-link card from the CMS.", null, null, 2],
    ["contact", "intro", "Intro", "Contact Us", "Talk to Pipnest support.", "Use the support ticket system inside the dashboard for account requests, or reach out through the contact form for general inquiries.", null, null, 1],
    ["contact", "form", "Contact Form", null, "Send a message to support", "Customize contact-form helper copy and operations notes from the CMS.", null, null, 2],
    ["faq", "intro", "Intro", "FAQ", "Common platform questions.", "Answers for funding, account assignment, coupons, affiliates, and future MT4/MT5 integrations.", null, null, 1],
    ["faq", "questions", "Questions", null, "Frequently asked questions", "Manage FAQ section framing from the CMS while detailed questions remain editable in code or future CMS fields.", null, null, 2],
    ["terms", "body", "Body", "Legal", "Terms & Conditions", "PipNest Markets provides simulated trading challenges and dashboard tooling. Final legal terms should be reviewed by counsel before production launch.", null, null, 1],
    ["privacy", "body", "Body", "Legal", "Privacy Policy", "The platform stores account, order, support, notification, and affiliate data in PostgreSQL through Prisma. Secrets must remain server-side and environment-based.", null, null, 1],
    ["risk-disclosure", "body", "Body", "Legal", "Risk Disclosure", "Trading involves risk. PipNest Markets challenge screens use simulated accounts and dummy MT4/MT5 statistics until a real Manager API integration is connected.", null, null, 1],
    ["refund-policy", "body", "Body", "Legal", "Refund Policy", "Refund rules should be configured according to business policy. The schema includes order and payment statuses needed to track paid, failed, cancelled, and refunded states.", null, null, 1]
  ] as const;

  for (const [pageSlug, sectionKey, label, eyebrow, title, content, ctaLabel, ctaHref, sortOrder] of sectionSeeds) {
    const page = await prisma.cmsPage.findUniqueOrThrow({ where: { slug: pageSlug } });
    await prisma.cmsSection.upsert({
      where: {
        pageSlug_sectionKey: {
          pageSlug,
          sectionKey
        }
      },
      update: {},
      create: {
        pageId: page.id,
        pageSlug,
        sectionKey,
        label,
        eyebrow,
        title,
        content,
        ctaLabel,
        ctaHref,
        sortOrder,
        updatedById: admin.id
      }
    });
  }

  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      action: "SEED_COMPLETED",
      entity: "System",
      metadata: { demoUsers: ["admin@pipnestfunding.com", "trader@pipnestfunding.com"] }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
