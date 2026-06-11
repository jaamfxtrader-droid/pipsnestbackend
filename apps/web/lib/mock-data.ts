import {
  Activity,
  BadgeDollarSign,
  Banknote,
  BarChart3,
  BookOpenText,
  CircleDollarSign,
  FileText,
  Headphones,
  IdCard,
  LayoutDashboard,
  LineChart,
  Megaphone,
  Settings,
  ShieldCheck,
  Ticket,
  UserCog,
  Users,
  Wallet,
  Waypoints
} from "lucide-react";

export const navLinks = [
  { href: "/funding-programs", label: "Programs" },
  { href: "/challenge-details", label: "Challenge Details" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/payouts", label: "Payouts" },
  { href: "/affiliate", label: "Affiliate" },
  { href: "/faq", label: "FAQ" }
];

export const fundingPrograms = [
  {
    id: "starter",
    name: "Starter",
    accountSize: 10000,
    price: 89,
    profitTarget: 8,
    dailyDrawdown: 5,
    maxDrawdown: 10,
    minDays: 5,
    leverage: "1:100",
    phase: "2-Step"
  },
  {
    id: "growth",
    name: "Growth",
    accountSize: 50000,
    price: 299,
    profitTarget: 8,
    dailyDrawdown: 5,
    maxDrawdown: 10,
    minDays: 5,
    leverage: "1:100",
    phase: "2-Step",
    featured: true
  },
  {
    id: "elite",
    name: "Elite",
    accountSize: 100000,
    price: 499,
    profitTarget: 10,
    dailyDrawdown: 4,
    maxDrawdown: 8,
    minDays: 7,
    leverage: "1:100",
    phase: "2-Step"
  }
];

export const dashboardStats = [
  { label: "Equity", value: "$52,840", change: "+5.68%", icon: LineChart, tone: "profit" },
  { label: "Profit Target", value: "71%", change: "$2,840 / $4,000", icon: CircleDollarSign, tone: "primary" },
  { label: "Daily Drawdown", value: "0.8%", change: "Limit 5%", icon: Activity, tone: "warning" },
  { label: "Max Drawdown", value: "2.8%", change: "Limit 10%", icon: ShieldCheck, tone: "loss" }
];

export const performanceSeries = [
  { day: "Mon", equity: 50120, balance: 50000 },
  { day: "Tue", equity: 50890, balance: 50000 },
  { day: "Wed", equity: 51740, balance: 50000 },
  { day: "Thu", equity: 51280, balance: 50000 },
  { day: "Fri", equity: 52840, balance: 50000 },
  { day: "Sat", equity: 53120, balance: 50000 },
  { day: "Sun", equity: 52840, balance: 50000 }
];

export const accounts = [
  {
    login: "90050123",
    platform: "MT5",
    server: "Pipnest-Demo",
    challenge: "Growth Challenge",
    size: "$50,000",
    status: "active",
    equity: "$52,840",
    progress: 71
  },
  {
    login: "84017220",
    platform: "MT4",
    server: "Pipnest-MT4-Demo",
    challenge: "Starter Challenge",
    size: "$10,000",
    status: "pending",
    equity: "$10,000",
    progress: 0
  }
];

export const transactions = [
  { id: "PNF-10001", type: "Challenge Purchase", amount: "$254.15", status: "paid", date: "2026-05-18" },
  { id: "PAY-7712", type: "Payout Request", amount: "$850.00", status: "pending", date: "2026-05-25" },
  { id: "AFF-2209", type: "Affiliate Commission", amount: "$25.42", status: "active", date: "2026-05-26" }
];

export const tickets = [
  { id: "TCK-104", subject: "Account credentials confirmation", status: "in progress", priority: "medium" },
  { id: "TCK-098", subject: "Payout document review", status: "resolved", priority: "low" }
];

export const notifications = [
  { title: "Trading account assigned", message: "Growth Challenge MT5 account is active.", type: "challenge" },
  { title: "Payout request received", message: "Your payout request is pending review.", type: "payout" },
  { title: "Coupon available", message: "LAUNCH15 is available for the next purchase.", type: "info" }
];

export const dashboardLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/challenges", label: "My Challenges", icon: ShieldCheck },
  { href: "/dashboard/accounts", label: "Trading Accounts", icon: BarChart3 },
  { href: "/dashboard/topup", label: "Top Up", icon: BadgeDollarSign },
  { href: "/dashboard/kyc", label: "KYC Verification", icon: IdCard },
  { href: "/dashboard/payouts", label: "Payouts & Ledger", icon: Wallet },
  { href: "/dashboard/support", label: "Support Tickets", icon: Headphones },
  { href: "/dashboard/profile", label: "Trader Settings", icon: UserCog },
  { href: "/dashboard/affiliate", label: "Affiliate", icon: Waypoints }
];

export const adminLinks = [
  { href: "/admin", label: "Dashboard & Reports", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/kyc", label: "KYC Reviews", icon: IdCard },
  { href: "/admin/challenges", label: "Challenges & Orders", icon: ShieldCheck },
  { href: "/admin/trading-accounts", label: "Trading Accounts", icon: BarChart3 },
  { href: "/admin/topups", label: "Top-ups", icon: BadgeDollarSign },
  { href: "/admin/payouts", label: "Finance", icon: Wallet },
  { href: "/admin/support", label: "Support", icon: Headphones },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/affiliate", label: "Affiliate", icon: Megaphone },
  { href: "/admin/cms", label: "CMS Pages", icon: FileText },
  { href: "/admin/blogs", label: "Blog CMS", icon: BookOpenText },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

export const adminMetrics = [
  { label: "Total Users", value: "1,248", change: "+14.2%", icon: Users, tone: "primary" },
  { label: "Monthly Revenue", value: "$84,920", change: "+22.8%", icon: BadgeDollarSign, tone: "profit" },
  { label: "Pending Payouts", value: "$18,450", change: "12 requests", icon: Banknote, tone: "warning" },
  { label: "Open Tickets", value: "19", change: "4 urgent", icon: Headphones, tone: "loss" }
];
