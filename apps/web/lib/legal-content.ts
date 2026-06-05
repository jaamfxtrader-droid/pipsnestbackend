export type LegalSection = {
  title: string;
  body?: string[];
  bullets?: string[];
};

export type FaqItem = {
  question: string;
  answer?: string[];
  bullets?: string[];
};

export const faqItems: FaqItem[] = [
  {
    question: "What is this funding company?",
    answer: [
      "We are a proprietary trading firm that provides traders with access to funded trading capital. Traders are required to pass an evaluation process to demonstrate their skills in risk management, consistency, and profitability.",
      "Once you successfully pass the evaluation phase, you are eligible to trade a funded account and earn profit splits based on performance."
    ]
  },
  {
    question: "How can I get a funded account?",
    answer: ["To obtain a funded account, you must complete the following steps:"],
    bullets: [
      "Register and purchase a trading challenge/evaluation account",
      "Trade according to the rules provided (profit target, drawdown limits, and risk management rules)",
      "Successfully pass the evaluation phase without violating any rules",
      "Receive your funded account after verification"
    ]
  },
  {
    question: "Is the challenge fee refundable?",
    answer: [
      "No. The challenge fee is strictly non-refundable. This fee covers access to our trading platform, evaluation environment, account setup, and operational costs.",
      "However, in some promotional programs, successful traders may be eligible for fee reimbursement under specific conditions."
    ]
  },
  {
    question: "Do I need trading experience to join?",
    answer: ["Yes, basic knowledge of trading is strongly recommended. You should understand:"],
    bullets: [
      "Forex market basics",
      "Risk management",
      "Lot size calculation",
      "Stop loss and take profit usage",
      "Beginners can also join, but proper practice on demo accounts is advised before attempting evaluation."
    ]
  },
  {
    question: "What markets can I trade?",
    answer: ["Depending on your account type, you may trade:"],
    bullets: [
      "Forex currency pairs (EUR/USD, GBP/USD, XAUUSD, etc.)",
      "Indices (US30, NAS100, GER40, etc.)",
      "Commodities (Gold, Silver, Oil)",
      "Other instruments as provided by the platform"
    ]
  },
  {
    question: "What is the profit target?",
    answer: [
      "Each evaluation phase includes a specific profit target that must be achieved to pass the challenge.",
      "For example, a phase may require a 5%-10% profit depending on account type. You must reach the target without violating drawdown or risk rules."
    ]
  },
  {
    question: "What is maximum drawdown?",
    answer: [
      "Maximum drawdown is the maximum allowed loss on your account.",
      "There are usually two types:"
    ],
    bullets: [
      "Daily Drawdown: Maximum loss allowed in a single trading day",
      "Overall Drawdown: Maximum total loss allowed on the account",
      "If you exceed either limit, your account will be considered failed."
    ]
  },
  {
    question: "Can I use Expert Advisors (EA) or trading bots?",
    answer: ["Usage of EAs, bots, or automated systems depends on company policy."],
    bullets: [
      "Some strategies are allowed if they are not abusive or high-risk",
      "Arbitrage, hedge abuse, or latency exploitation strategies are strictly prohibited",
      "Always check specific challenge rules before using automation tools."
    ]
  },
  {
    question: "How long does the evaluation take?",
    answer: [
      "There is no fixed time limit unless specified in your account type.",
      "You can take your time to complete the challenge. However, traders are encouraged to maintain consistency and avoid overtrading or gambling behavior."
    ]
  },
  {
    question: "When do I get paid after passing?",
    answer: [
      "After successfully passing the evaluation and receiving a funded account, you become eligible for profit withdrawals.",
      "Payouts are processed according to:"
    ],
    bullets: [
      "Minimum trading days (if required)",
      "Profit threshold",
      "Risk compliance",
      "Payout schedules vary (weekly, bi-weekly, or monthly depending on plan)."
    ]
  },
  {
    question: "How are payouts processed?",
    answer: ["We support multiple payout methods depending on your region, such as:"],
    bullets: [
      "Bank transfer",
      "Crypto (USDT, BTC, etc.)",
      "Other approved payment gateways",
      "Processing time typically ranges from 24 hours to a few business days."
    ]
  },
  {
    question: "Can I scale my account?",
    answer: [
      "Yes. Traders who consistently perform well and follow risk rules may qualify for account scaling.",
      "Scaling means:"
    ],
    bullets: [
      "Increased capital allocation",
      "Higher profit potential",
      "Long-term partnership opportunities"
    ]
  },
  {
    question: "What trading strategies are allowed?",
    answer: ["You are allowed to use standard trading strategies such as:"],
    bullets: [
      "Day trading",
      "Swing trading",
      "Breakout strategies",
      "Price action trading",
      "Technical analysis-based trading",
      "However, strictly prohibited strategies include: gambling / random trading, high-frequency abuse, arbitrage exploitation, and manipulative trading practices."
    ]
  },
  {
    question: "What happens if I break the rules?",
    answer: ["If you violate trading rules such as drawdown limits, prohibited strategies, or risk policies:"],
    bullets: [
      "Your evaluation account will be failed immediately",
      "In some cases, funded accounts may be suspended",
      "No refunds will be issued"
    ]
  },
  {
    question: "Is trading risky?",
    answer: [
      "Yes. Trading financial markets involves high risk and may result in loss of capital.",
      "We strongly recommend:"
    ],
    bullets: [
      "Proper risk management",
      "Controlled position sizing",
      "Emotional discipline",
      "Continuous learning"
    ]
  },
  {
    question: "Can I trade news events?",
    answer: [
      "This depends on your account type. Some accounts allow news trading, while others may restrict it during high-impact events due to volatility risk."
    ]
  },
  {
    question: "Can I hold trades overnight or over weekends?",
    answer: ["Yes or no depending on your rules:"],
    bullets: [
      "Some accounts allow overnight holding",
      "Some restrict weekend holding to avoid gaps and volatility risk",
      "Always check your account specifications."
    ]
  },
  {
    question: "Do you provide support?",
    answer: ["Yes. Our support team is available to assist you with:"],
    bullets: [
      "Account issues",
      "Technical problems",
      "Payment queries",
      "General guidance",
      "You can contact us via email or live chat support."
    ]
  }
];

export const termsSections: LegalSection[] = [
  {
    title: "Preamble",
    body: [
      "These Terms & Conditions govern your access to and use of the services provided by PipNest Markets (\"Company\", \"We\", \"Us\", or \"Our\"). By accessing our website, purchasing any challenge, creating an account, or using our services, you acknowledge that you have read, understood, and agreed to be bound by these Terms & Conditions.",
      "If you do not agree with any provision of these Terms, you must immediately discontinue use of our website and services.",
      "The services provided by PipNest Markets are intended exclusively for individuals who are at least 18 years of age and legally permitted to use such services within their jurisdiction.",
      "All accounts offered by PipNest Markets operate within a simulated trading environment unless otherwise expressly stated. No real-money trading accounts are provided through our evaluation programs."
    ]
  },
  {
    title: "No Investment Services",
    body: [
      "PipNest Markets does not provide investment advice, financial recommendations, portfolio management, brokerage services, or financial consulting.",
      "Nothing on our website, platform, social media channels, emails, or communications shall be interpreted as:"
    ],
    bullets: [
      "Investment advice",
      "Financial guidance",
      "Trading recommendations",
      "Solicitation to buy or sell financial instruments",
      "Brokerage or custodial services",
      "All services are strictly educational and evaluation-based."
    ]
  },
  {
    title: "Registration & Eligibility",
    body: ["By registering with PipNest Markets, you confirm that:"],
    bullets: [
      "You are at least 18 years old.",
      "All information provided is accurate and complete.",
      "You are legally permitted to access our services.",
      "You will not use the services for unlawful purposes.",
      "You accept responsibility for maintaining account security.",
      "Providing false information may result in immediate account suspension or termination."
    ]
  },
  {
    title: "Simulated Trading Environment",
    body: [
      "All challenge accounts, evaluation accounts, and funded simulation accounts operate in a demo environment.",
      "Participants acknowledge that:"
    ],
    bullets: [
      "Trades are simulated.",
      "Results displayed are simulated.",
      "Simulated performance does not guarantee future results.",
      "No real market execution occurs during evaluation stages."
    ]
  },
  {
    title: "Challenge Rules",
    body: [
      "Maximum Daily Loss: Traders must not exceed the maximum daily loss limit specified in their challenge.",
      "Maximum Overall Drawdown: Traders must not exceed the maximum overall drawdown limit assigned to their account.",
      "Profit Target: Traders must achieve the designated profit target while respecting all trading rules.",
      "Minimum Trading Days: Traders must complete the minimum required trading days before becoming eligible to pass a challenge phase.",
      "Failure to comply with any challenge rule will result in challenge failure."
    ]
  },
  {
    title: "Prohibited Trading Practices",
    body: ["The following activities are strictly prohibited:"],
    bullets: [
      "Arbitrage trading",
      "Latency exploitation",
      "Tick scalping abuse",
      "High-frequency trading abuse",
      "Opposite account trading",
      "Account sharing",
      "Third-party account management",
      "Unauthorized copy trading",
      "Exploiting platform errors",
      "Any activity designed to manipulate challenge results",
      "PipNest Markets reserves the right to determine whether a trading practice violates these Terms."
    ]
  },
  {
    title: "Account Suspension & Termination",
    body: ["PipNest Markets reserves the right to suspend, restrict, or terminate any account if:"],
    bullets: [
      "Trading rules are violated.",
      "Fraudulent activity is detected.",
      "False information is provided.",
      "Terms & Conditions are breached.",
      "Suspicious trading behavior is identified."
    ]
  },
  {
    title: "Limitation of Liability",
    body: ["PipNest Markets shall not be liable for:"],
    bullets: [
      "Trading losses",
      "Technical interruptions",
      "Platform downtime",
      "Internet failures",
      "Third-party service disruptions",
      "Indirect or consequential damages",
      "Services are provided on an \"as-is\" and \"as-available\" basis."
    ]
  },
  {
    title: "Amendments",
    body: [
      "PipNest Markets reserves the right to modify these Terms & Conditions at any time without prior notice.",
      "Continued use of the services after updates constitutes acceptance of the revised Terms."
    ]
  },
  {
    title: "Contact Information",
    body: [
      "For any questions regarding these Terms & Conditions, please contact:",
      "Support Team",
      "PipNest Markets"
    ]
  },
  {
    title: "Acceptance",
    body: [
      "By creating an account, purchasing a challenge, or using our services, you acknowledge that you have read, understood, and agreed to these Terms & Conditions."
    ]
  }
];

export const privacySections: LegalSection[] = [
  {
    title: "About This Policy",
    body: [
      "This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website and services. By using our website and services, you agree to the practices described in this Privacy Policy."
    ]
  },
  {
    title: "Collection of Personal Information",
    body: [
      "To provide better services, we may collect personally identifiable information such as:",
      "First and Last Name; Home Address; Email Address; Phone Number.",
      "We only collect personal information when you voluntarily provide it to us, such as when you:"
    ],
    bullets: [
      "Register for an account",
      "Purchase or use our services",
      "Contact our support team",
      "Subscribe to offers or updates",
      "Submit payment or verification information"
    ]
  },
  {
    title: "Use of Personal Information",
    body: [
      "We use your personal information to operate our services and deliver the products you request. We may also use your information to communicate updates, offers, and service-related notifications."
    ]
  },
  {
    title: "Sharing Information with Third Parties",
    body: [
      "We do not sell your personal information. However, we may share data with trusted third parties such as payment processors, hosting providers, analytic services, and verification partners.",
      "These third parties are only allowed to use your information to provide services on our behalf and must keep it confidential.",
      "We may also disclose information if required by law or to protect our rights, users, or the public."
    ]
  },
  {
    title: "Tracking User Behavior",
    body: [
      "We may track user activity within our website to understand usage patterns and improve our services. This includes pages visited and actions taken on the platform."
    ]
  },
  {
    title: "Automatically Collected Information",
    body: [
      "We may automatically collect information such as IP address, browser type, device information, access time, and referring website.",
      "This data is used for security, analytic, and improving service performance."
    ]
  },
  {
    title: "Use of Cookies",
    body: [
      "We use cookies to improve user experience and website functionality. Cookies help us remember your preferences and improve navigation.",
      "You may disable cookies in your browser settings, but some features may not function properly."
    ]
  },
  {
    title: "Links to Other Websites",
    body: [
      "Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of these external sites."
    ]
  },
  {
    title: "Data Security",
    body: [
      "We use SSL encryption and other security measures to protect your personal information. However, no online transmission is 100% secure, and we cannot guarantee absolute security."
    ]
  },
  {
    title: "Right to Deletion",
    body: [
      "You may request deletion of your personal data, subject to legal and regulatory requirements. We will process such requests where applicable."
    ]
  },
  {
    title: "Children's Privacy",
    body: ["We do not knowingly collect information from individuals under the age of 13."]
  },
  {
    title: "Email Communication",
    body: [
      "We may send you emails related to your account, services, and promotional offers. You may unsubscribe from marketing emails at any time."
    ]
  },
  {
    title: "External Data Storage",
    body: ["We may store your data on third-party hosting servers to ensure proper service delivery."]
  },
  {
    title: "Changes to This Policy",
    body: [
      "We reserve the right to update this Privacy Policy at any time. Changes will be posted on this page. Continued use of our services means you accept the updated policy."
    ]
  },
  {
    title: "Contact Us",
    body: ["For any questions regarding this Privacy Policy, contact us at:", "Email:"]
  }
];

export const refundSections: LegalSection[] = [
  {
    title: "Challenge Fees",
    body: [
      "All challenge and evaluation fees paid to participate in our funding programs are non-refundable.",
      "By purchasing a challenge, the customer gains immediate access to our trading platform, evaluation environment, and related services. Therefore, refunds cannot be issued once an order has been completed and account credentials have been delivered."
    ]
  },
  {
    title: "Duplicate Payments",
    body: [
      "If a customer is charged multiple times for the same order due to a technical error, the duplicate payment may be refunded after verification by our support team."
    ]
  },
  {
    title: "Account Violations",
    body: [
      "No refunds will be provided for accounts that fail the evaluation, violate trading rules, breach our Terms & Conditions, or are suspended due to prohibited trading practices."
    ]
  },
  {
    title: "Funded Accounts",
    body: [
      "Once a trader successfully passes an evaluation and receives a funded account, the original challenge fee is not refundable unless otherwise stated in a specific promotional offer."
    ]
  },
  {
    title: "Exceptional Circumstances",
    body: [
      "Refund requests resulting from technical issues on our side will be reviewed on a case-by-case basis. We reserve the right to determine eligibility for any refund."
    ]
  },
  {
    title: "Contact Us",
    body: ["For questions regarding this Refund Policy, please contact our support team at:", "Email:"]
  }
];

export const disclaimerSections: LegalSection[] = [
  {
    title: "Simulated Trading Setup",
    body: [
      "All accounts offered by our company operate exclusively in a simulated trading environment. No real trades are executed in live financial markets. Our services are provided solely for educational and evaluation purposes."
    ]
  },
  {
    title: "No Investment Solutions",
    body: [
      "The Company does not provide investment advice, financial recommendations, brokerage services, custodial services, or financial intermediary services."
    ]
  },
  {
    title: "Program Fees & Service Charges",
    body: [
      "All fees paid to the Company are service fees only. These fees are not deposits, investments, or client funds and do not generate interest, returns, or profit-sharing benefits."
    ]
  },
  {
    title: "Operational Use of Fees",
    body: [
      "Program fees are used to support operational and administrative expenses, including technology infrastructure, platform maintenance, software licensing, risk management systems, customer support, and business operations."
    ]
  },
  {
    title: "No Fiduciary or Investment Relationship",
    body: [
      "Payment of program fees does not establish any fiduciary duty, custodial relationship, investment arrangement, or financial partnership between participants and the Company."
    ]
  },
  {
    title: "Financial Products Disclaimer",
    body: [
      "Nothing on this website or within our programs constitutes an offer, solicitation, or recommendation to buy or sell forex, CFDs, stocks, futures, options, cryptocurrencies, or any other financial instruments."
    ]
  },
  {
    title: "Simulated Performance Disclosure",
    body: [
      "All trading results displayed on this website are based on simulated trading activity. Simulated performance does not guarantee future results and may differ significantly from real-market performance."
    ]
  },
  {
    title: "General Risk Warning",
    body: [
      "Trading financial markets involves substantial risk. Participants should carefully assess their objectives, experience level, and risk tolerance before engaging in any trading-related activity.",
      "Engaging in financial market trading carries a significant risk of loss. Even in a controlled setting, strategies evaluated under leveraged circumstances may yield results that do not represent actual execution. It's important to thoughtfully evaluate your goals, experience level, and appetite for risk before getting involved."
    ]
  },
  {
    title: "Acceptance of Terms",
    body: [
      "By accessing our website and participating in our programs, you acknowledge and accept all terms, conditions, policies, and disclaimers outlined by the Company."
    ]
  }
];

export const riskSections: LegalSection[] = [
  {
    title: "Risk Disclosure",
    body: [
      "Trading financial markets involves substantial risk and may not be suitable for all individuals. All accounts provided by PipNest Markets operate within a simulated trading environment and are intended solely for educational and evaluation purposes.",
      "Past simulated performance does not guarantee future results. Simulated trading results may differ significantly from real-market performance due to factors such as market liquidity, slippage, execution delays, psychological influences, and changing market conditions.",
      "By participating in any PipNest Markets program, you acknowledge that you understand the risks associated with financial markets and accept full responsibility for your trading decisions."
    ]
  }
];

export const kycSections: LegalSection[] = [
  ...riskSections,
  {
    title: "Identity Verification",
    body: [
      "To maintain a secure and compliant trading environment, PipNest Markets reserves the right to conduct Know Your Customer (KYC) verification procedures.",
      "Users may be required to provide:"
    ],
    bullets: [
      "Government-issued identification document",
      "Proof of residential address",
      "Selfie or biometric verification",
      "Additional documentation upon request",
      "Verification may be required before account activation, payouts, account upgrades, or whenever deemed necessary by the Company."
    ]
  },
  {
    title: "Anti-Money Laundering (AML)",
    body: [
      "PipNest Markets is committed to preventing money laundering, terrorist financing, fraud, identity theft, and other unlawful activities.",
      "We reserve the right to:"
    ],
    bullets: [
      "Request additional verification documents",
      "Suspend accounts pending investigation",
      "Reject applications that fail verification checks",
      "Report suspicious activities to relevant authorities where required by law",
      "Permanently terminate accounts involved in fraudulent or illegal activities",
      "Failure to cooperate with KYC or AML procedures may result in account suspension or termination."
    ]
  },
  {
    title: "Responsible Trading Policy",
    body: [
      "At PipNest Markets, we encourage disciplined and professional trading practices. All traders are expected to manage risk responsibly and demonstrate consistency throughout the evaluation process."
    ]
  },
  {
    title: "Trader Responsibilities",
    body: ["All traders must:"],
    bullets: [
      "Apply proper risk management principles",
      "Trade according to a structured strategy",
      "Preserve capital and avoid unnecessary risk",
      "Maintain professional trading behavior",
      "Follow all challenge and account rules",
      "Trade independently and ethically"
    ]
  },
  {
    title: "Prohibited Behaviors",
    body: ["The following behaviors are considered irresponsible and may result in account review or termination:"],
    bullets: [
      "Excessive risk-taking",
      "Gambling-style trading",
      "Revenge trading",
      "Over-leveraging positions",
      "Intentional rule violations",
      "Manipulative or abusive trading practices",
      "Account sharing or unauthorized account management"
    ]
  },
  {
    title: "Risk Management Expectations",
    body: ["Traders should:"],
    bullets: [
      "Use appropriate stop-loss protection",
      "Manage position sizing responsibly",
      "Avoid risking excessive portions of account equity",
      "Focus on long-term consistency rather than short-term gains"
    ]
  },
  {
    title: "Company Review Rights",
    body: [
      "PipNest Markets reserves the right to review trading activity at any time to ensure compliance with company policies and responsible trading standards.",
      "Accounts found to be engaging in reckless, abusive, manipulative, or prohibited trading behavior may be restricted, suspended, or terminated without notice."
    ]
  },
  {
    title: "Policy Updates",
    body: [
      "PipNest Markets reserves the right to amend or update this Responsible Trading Policy at any time. Continued use of our services constitutes acceptance of any future revisions."
    ]
  }
];
