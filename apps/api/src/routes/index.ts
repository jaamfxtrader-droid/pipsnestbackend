import { Router } from "express";
import { adminRouter } from "./admin.js";
import { affiliateRouter, adminAffiliateRouter } from "./affiliate.js";
import { authRouter } from "./auth.js";
import { adminBlogRouter, blogRouter } from "./blogs.js";
import { adminChallengeRouter, challengeRouter } from "./challenges.js";
import { cmsRouter } from "./cms.js";
import { contactRouter } from "./contact.js";
import { adminKycRouter, kycRouter } from "./kyc.js";
import { notificationRouter } from "./notifications.js";
import { adminOrderRouter, orderRouter } from "./orders.js";
import { adminPaymentRouter, paymentRouter } from "./payments.js";
import { adminPayoutRouter, payoutRouter } from "./payouts.js";
import { adminSupportRouter, supportRouter } from "./support.js";
import { adminTradingAccountRouter, tradingAccountRouter } from "./trading-accounts.js";
import { adminTopUpRouter, topUpRouter } from "./topups.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ success: true, data: { service: "pipnest-api", status: "ok" } });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/challenges", challengeRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/payments", paymentRouter);
apiRouter.use("/trading-accounts", tradingAccountRouter);
apiRouter.use("/payouts", payoutRouter);
apiRouter.use("/topups", topUpRouter);
apiRouter.use("/support", supportRouter);
apiRouter.use("/affiliate", affiliateRouter);
apiRouter.use("/kyc", kycRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/blogs", blogRouter);
apiRouter.use("/cms", cmsRouter);
apiRouter.use("/contact", contactRouter);

apiRouter.use("/admin", adminRouter);
apiRouter.use("/admin/challenges", adminChallengeRouter);
apiRouter.use("/admin/blogs", adminBlogRouter);
apiRouter.use("/admin/orders", adminOrderRouter);
apiRouter.use("/admin/payments", adminPaymentRouter);
apiRouter.use("/admin/trading-accounts", adminTradingAccountRouter);
apiRouter.use("/admin/payouts", adminPayoutRouter);
apiRouter.use("/admin/topups", adminTopUpRouter);
apiRouter.use("/admin/support", adminSupportRouter);
apiRouter.use("/admin/affiliate", adminAffiliateRouter);
apiRouter.use("/admin/kyc", adminKycRouter);
