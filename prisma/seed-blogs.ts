import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const posts = [
  {
    title: "Daily Market Prep Checklist for Funded Traders",
    slug: "daily-market-prep-checklist-funded-traders",
    shortDescription: "A practical pre-session checklist for traders who need clean execution, risk control, and a repeatable plan.",
    description:
      "Funded accounts reward consistency more than excitement. This guide gives traders a simple daily routine for preparing bias, risk, setups, and review notes before the first trade.",
    content:
      "A funded trader's day should begin before the chart starts moving fast. Start with the economic calendar, confirm session liquidity, mark major levels, and decide where you will not trade. The best routine is short enough to repeat and strict enough to stop impulsive entries.\n\nUse this checklist as a daily filter: market context, key levels, session plan, maximum risk, invalidation rules, and post-session review. If one part is missing, reduce size or skip the session.",
    category: "Trading Psychology",
    tags: ["funded traders", "risk management", "daily plan"],
    keywords: ["funded trading checklist", "prop firm routine", "daily market prep"],
    referenceCtaText: "View Programs",
    referenceCtaUrl: "/funding-programs",
    seoTitle: "Daily Market Prep Checklist for Funded Traders",
    seoDescription: "Build a repeatable daily trading checklist for funded accounts, including risk limits, session planning, and trade review.",
    seoKeywords: ["funded trader checklist", "market prep", "risk plan"],
    images: [
      {
        imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1400&q=80",
        altText: "Trading chart workstation"
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1642790551116-18e150f248e7?auto=format&fit=crop&w=1400&q=80",
        altText: "Market chart analysis on screens"
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80",
        altText: "Notebook and financial planning"
      }
    ],
    sections: [
      {
        heading: "What should you check before trading?",
        content:
          "Check high-impact news, previous day highs and lows, session open levels, spread conditions, and your maximum daily loss. A trade idea is not complete until the invalidation level is clear.",
        imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1000&q=80"
      },
      {
        heading: "How much risk is enough?",
        content:
          "For funded accounts, the goal is survival first. Many traders perform better when they risk less than the maximum allowed, especially around news or after a losing streak."
      },
      {
        heading: "When should you stop for the day?",
        content:
          "Stop when your plan is no longer objective. Two emotional trades, one broken rule, or a hit daily loss limit should end the session."
      }
    ]
  },
  {
    title: "How to Trade News Without Breaking Prop Firm Rules",
    slug: "trade-news-without-breaking-prop-firm-rules",
    shortDescription: "A calm framework for handling CPI, FOMC, NFP, and central-bank volatility inside a funded trading challenge.",
    description:
      "News events create opportunity, but they also create slippage, spread expansion, and emotional execution. Learn how to plan around high-impact releases without turning a challenge into a coin flip.",
    content:
      "Trading around news is not just about predicting direction. For prop firm accounts, the bigger challenge is controlling execution quality. Spreads widen, fills slip, and stops can behave differently than expected.\n\nA professional approach is to classify each event before the session: avoid, observe, or trade after confirmation. Most traders do not need to trade the first candle. Waiting for spreads to normalize can protect both capital and discipline.",
    category: "Risk Management",
    tags: ["news trading", "prop firm rules", "volatility"],
    keywords: ["trade news prop firm", "NFP trading", "FOMC risk management"],
    referenceCtaText: "Read Challenge Details",
    referenceCtaUrl: "/challenge-details",
    seoTitle: "How to Trade News Without Breaking Prop Firm Rules",
    seoDescription: "Learn how to manage news volatility, spreads, and risk limits while trading a funded account or prop firm challenge.",
    seoKeywords: ["news trading rules", "prop firm news trading", "funded account risk"],
    images: [
      {
        imageUrl: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1400&q=80",
        altText: "Traders reviewing market news"
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=1400&q=80",
        altText: "Financial discussion in office"
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80",
        altText: "Analytics dashboard"
      }
    ],
    sections: [
      {
        heading: "Which news events matter most?",
        content:
          "Focus on events with direct impact on your instruments: CPI, NFP, FOMC, interest-rate decisions, GDP, and central-bank speeches. Mark them before the session begins.",
        imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1000&q=80"
      },
      {
        heading: "Should you trade before the release?",
        content:
          "Pre-news entries can work, but they carry gap and spread risk. If your strategy is not specifically built for news, wait for the release and trade the structure that forms after."
      },
      {
        heading: "How do you reduce execution risk?",
        content:
          "Use smaller size, wider planning zones, and clear no-trade windows. Avoid moving stops emotionally while spreads are still unstable."
      }
    ]
  },
  {
    title: "MT5 Position Sizing Guide for Challenge Accounts",
    slug: "mt5-position-sizing-guide-challenge-accounts",
    shortDescription: "Learn a simple way to calculate lot size around daily drawdown, max loss, stop distance, and account phase.",
    description:
      "Position sizing is the bridge between a good setup and a protected challenge account. This guide breaks down a clean MT5 sizing routine for funded traders.",
    content:
      "The same setup can be smart or reckless depending on size. Before opening a trade in MT5, calculate the dollar risk, stop distance, and the account rule that matters most that day. If a single trade can damage your daily drawdown buffer, the setup is too large.\n\nA consistent sizing model makes results easier to review. Keep one risk unit, use it repeatedly, and only scale after your execution data proves stability.",
    category: "Platform Guides",
    tags: ["MT5", "position sizing", "challenge accounts"],
    keywords: ["MT5 lot size", "prop firm position sizing", "challenge account risk"],
    referenceCtaText: "Open Dashboard",
    referenceCtaUrl: "/dashboard",
    seoTitle: "MT5 Position Sizing Guide for Challenge Accounts",
    seoDescription: "A simple MT5 position sizing guide for funded challenge accounts, daily drawdown control, and repeatable trade risk.",
    seoKeywords: ["MT5 position sizing", "lot size funded account", "challenge risk"],
    images: [
      {
        imageUrl: "https://images.unsplash.com/photo-1535320903710-d993d3d77d29?auto=format&fit=crop&w=1400&q=80",
        altText: "Trading charts on laptop"
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1400&q=80",
        altText: "Financial data analysis"
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1556155092-490a1ba16284?auto=format&fit=crop&w=1400&q=80",
        altText: "Working on trading calculations"
      }
    ],
    sections: [
      {
        heading: "What is the safest risk unit?",
        content:
          "Many challenge traders start with 0.25% to 0.5% per trade. The right number depends on stop distance, strategy frequency, and how much daily loss buffer remains."
      },
      {
        heading: "How do stop losses affect lot size?",
        content:
          "A wider stop requires smaller lot size if dollar risk stays fixed. Never keep the same lot size just because the setup looks strong.",
        imageUrl: "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?auto=format&fit=crop&w=1000&q=80"
      },
      {
        heading: "When should size be reduced?",
        content:
          "Reduce size after losses, before high-impact news, during low liquidity, and whenever spreads are unstable. Protecting the account is part of the edge."
      }
    ]
  },
  {
    title: "Reading Price Action After London Open",
    slug: "reading-price-action-after-london-open",
    shortDescription: "A session-based guide for spotting cleaner continuation and reversal structure after London liquidity enters the market.",
    description:
      "London open often sets the tone for FX and index traders. This post explains how to wait for structure instead of chasing the first impulse.",
    content:
      "The first move after London open is often designed to test liquidity. Instead of entering immediately, mark the opening range, wait for displacement, and judge whether price accepts above or below the range.\n\nA clean London plan is built around patience: identify the sweep, wait for confirmation, and only trade when the stop location is logical.",
    category: "Market Structure",
    tags: ["London open", "price action", "session trading"],
    keywords: ["London open trading", "price action guide", "session structure"],
    referenceCtaText: "Explore Funding",
    referenceCtaUrl: "/funding-programs",
    seoTitle: "Reading Price Action After London Open",
    seoDescription: "Learn how to read London open price action with liquidity sweeps, opening ranges, and structured confirmation.",
    seoKeywords: ["London open", "price action", "liquidity sweep"],
    images: [
      {
        imageUrl: "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?auto=format&fit=crop&w=1400&q=80",
        altText: "Trading candlestick chart"
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=1400&q=80",
        altText: "Market dashboard"
      }
    ],
    videos: [
      {
        videoUrl: "https://res.cloudinary.com/demo/video/upload/docs/walking_talking.mp4",
        title: "Session planning walkthrough"
      }
    ],
    sections: [
      {
        heading: "What makes London open different?",
        content: "Liquidity increases quickly, so the first impulse can be noisy. Traders should wait for acceptance instead of reacting to every fast candle."
      },
      {
        heading: "How do you mark the opening range?",
        content: "Use the first 15 to 30 minutes as context. A strong close outside the range with retest behavior often gives a cleaner setup."
      },
      {
        heading: "When is no trade the right decision?",
        content: "If spreads widen, price chops inside the range, or news is close, standing aside protects the account."
      }
    ]
  },
  {
    title: "Building a Weekly Review Routine That Actually Helps",
    slug: "weekly-review-routine-funded-traders",
    shortDescription: "A simple review method for turning trade history into better rules, cleaner setups, and calmer execution.",
    description:
      "Weekly reviews should not be emotional scorecards. They should show what to repeat, what to remove, and where risk needs tightening.",
    content:
      "A useful weekly review looks at behavior, not just profit. Group trades by setup type, session, risk amount, rule quality, and emotional state. The goal is to identify the smallest change that improves next week.\n\nKeep the review short and repeatable. If it becomes too complicated, it will not survive a stressful trading week.",
    category: "Trading Psychology",
    tags: ["weekly review", "trading journal", "execution"],
    keywords: ["trading review routine", "funded trader journal", "weekly trading review"],
    referenceCtaText: "Open Dashboard",
    referenceCtaUrl: "/dashboard",
    seoTitle: "Weekly Review Routine for Funded Traders",
    seoDescription: "Build a practical weekly trading review process for funded accounts and challenge consistency.",
    seoKeywords: ["weekly trading review", "trading journal", "funded trader routine"],
    images: [
      {
        imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80",
        altText: "Weekly review notes"
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1400&q=80",
        altText: "Team reviewing reports"
      }
    ],
    videos: [
      {
        videoUrl: "https://res.cloudinary.com/demo/video/upload/dog.mp4",
        title: "Review checklist example"
      },
      {
        videoUrl: "https://res.cloudinary.com/demo/video/upload/docs/walking_talking.mp4",
        title: "Journal notes walkthrough"
      }
    ],
    sections: [
      {
        heading: "What should you review first?",
        content: "Start with rule quality. A profitable trade that broke rules should not be counted as a good process trade."
      },
      {
        heading: "How do you find repeatable setups?",
        content: "Tag trades by setup type and session. The best setups usually appear as clusters, not isolated wins."
      },
      {
        heading: "What should change next week?",
        content: "Pick one behavior to improve. Too many changes make the next review harder to understand."
      }
    ]
  },
  {
    title: "How to Avoid Overtrading During Slow Sessions",
    slug: "avoid-overtrading-during-slow-sessions",
    shortDescription: "A practical framework for recognizing low-quality sessions before they drain focus, confidence, and daily drawdown.",
    description:
      "Slow sessions tempt traders into low-quality entries. This post gives a simple way to spot when the market is not worth your risk.",
    content:
      "Overtrading usually starts when the trader wants movement more than the market is offering it. If candles are small, ranges are tight, and spreads feel expensive, the account is paying for impatience.\n\nUse a slow-session checklist: range size, upcoming news, session overlap, spread behavior, and whether your setup has enough room to target.",
    category: "Risk Management",
    tags: ["overtrading", "discipline", "slow markets"],
    keywords: ["avoid overtrading", "slow session trading", "trading discipline"],
    referenceCtaText: "Read Rules",
    referenceCtaUrl: "/challenge-details",
    seoTitle: "How to Avoid Overtrading During Slow Sessions",
    seoDescription: "Learn how funded traders can avoid overtrading in slow markets and protect daily drawdown.",
    seoKeywords: ["overtrading", "slow market", "trader discipline"],
    images: [
      {
        imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
        altText: "Focused trader at laptop"
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1400&q=80",
        altText: "Professional working calmly"
      }
    ],
    sections: [
      {
        heading: "How do you identify a slow session?",
        content: "Compare current range to the average range for that session. If price is compressed and news is absent, quality may be low."
      },
      {
        heading: "What should you do instead of forcing trades?",
        content: "Set alerts at meaningful levels, reduce screen time, and review previous trades while waiting for price to reach better zones."
      },
      {
        heading: "When does patience become an edge?",
        content: "Patience matters most when the market is unclear. Skipping poor conditions keeps mental capital available for better trades."
      }
    ]
  },
  {
    title: "Using Audio Notes to Review Trading Decisions",
    slug: "using-audio-notes-to-review-trading-decisions",
    shortDescription: "A practical way to record short spoken notes after trades so your review captures context, confidence, and emotion.",
    description:
      "Written journals are useful, but short audio notes can capture the trader's thinking in the moment. This post shows how to use them without overcomplicating review.",
    content:
      "A trade journal is strongest when it captures the decision while it is still fresh. Audio notes can record why you entered, what you felt, and whether the setup matched your plan.\n\nKeep each note short. The goal is not a podcast; it is a clear snapshot of your decision quality.",
    category: "Trading Psychology",
    tags: ["audio review", "journal", "discipline"],
    keywords: ["audio trading journal", "trade review", "trading psychology"],
    referenceCtaText: "Start Challenge",
    referenceCtaUrl: "/funding-programs",
    seoTitle: "Using Audio Notes to Review Trading Decisions",
    seoDescription: "Use short audio notes to improve your trading journal and review decision quality.",
    seoKeywords: ["audio journal", "trading review", "decision quality"],
    images: [
      {
        imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1400&q=80",
        altText: "Audio waveform desk setup"
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1400&q=80",
        altText: "Laptop and notes"
      }
    ],
    videos: [
      {
        videoUrl: "https://res.cloudinary.com/demo/video/upload/elephants.mp4",
        title: "Sound-enabled review sample"
      }
    ],
    sections: [
      {
        heading: "When should you record the note?",
        content: "Record immediately after entry or exit. Waiting too long lets hindsight rewrite the real decision.",
        videos: [
          {
            videoUrl: "https://res.cloudinary.com/demo/video/upload/elephants.mp4",
            title: "Audio note playback sample"
          }
        ]
      },
      {
        heading: "What should the note include?",
        content: "Mention setup type, invalidation, risk, confidence level, and whether the trade followed the written plan."
      },
      {
        heading: "How do audio notes improve discipline?",
        content: "They make emotional patterns easier to detect. If the same hesitation or urgency appears repeatedly, it becomes reviewable."
      }
    ]
  }
];

async function main() {
  for (const post of posts) {
    const existing = await prisma.blog.findUnique({ where: { slug: post.slug }, select: { id: true } });
    if (existing) {
      await prisma.blogImage.deleteMany({ where: { blogId: existing.id } });
      await prisma.blogVideo.deleteMany({ where: { blogId: existing.id } });
      await prisma.blogAttachment.deleteMany({ where: { blogId: existing.id } });
      await prisma.blogSection.deleteMany({ where: { blogId: existing.id } });
    }

    await prisma.blog.upsert({
      where: { slug: post.slug },
      create: {
        title: post.title,
        slug: post.slug,
        shortDescription: post.shortDescription,
        description: post.description,
        content: post.content,
        category: post.category,
        tags: post.tags,
        keywords: post.keywords,
        status: "PUBLISHED",
        authorName: "PipNest Editorial",
        publishedAt: new Date(),
        referenceCtaText: post.referenceCtaText,
        referenceCtaUrl: post.referenceCtaUrl,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        seoKeywords: post.seoKeywords,
        images: { create: post.images.map((image, index) => ({ ...image, order: index })) },
        videos: { create: (post.videos ?? []).map((video, index) => ({ ...video, order: index })) },
        sections: {
          create: post.sections.map((section, index) => ({
            heading: section.heading,
            content: section.content,
            imageUrl: section.imageUrl ?? null,
            order: index,
            videos: { create: (section.videos ?? []).map((video, videoIndex) => ({ ...video, order: videoIndex })) }
          }))
        }
      },
      update: {
        title: post.title,
        shortDescription: post.shortDescription,
        description: post.description,
        content: post.content,
        category: post.category,
        tags: post.tags,
        keywords: post.keywords,
        status: "PUBLISHED",
        authorName: "PipNest Editorial",
        publishedAt: new Date(),
        referenceCtaText: post.referenceCtaText,
        referenceCtaUrl: post.referenceCtaUrl,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        seoKeywords: post.seoKeywords,
        images: { create: post.images.map((image, index) => ({ ...image, order: index })) },
        videos: { create: (post.videos ?? []).map((video, index) => ({ ...video, order: index })) },
        sections: {
          create: post.sections.map((section, index) => ({
            heading: section.heading,
            content: section.content,
            imageUrl: section.imageUrl ?? null,
            order: index,
            videos: { create: (section.videos ?? []).map((video, videoIndex) => ({ ...video, order: videoIndex })) }
          }))
        }
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log(`Seeded ${posts.length} blog posts.`);
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
