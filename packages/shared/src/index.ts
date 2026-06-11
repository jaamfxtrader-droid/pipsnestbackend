import { z } from "zod";

export const roles = ["TRADER", "ADMIN", "SUPER_ADMIN"] as const;
export const accountStatuses = ["PENDING", "ACTIVE", "PASSED", "FAILED", "SUSPENDED"] as const;
export const tradingPlatforms = ["MT4", "MT5"] as const;
export const challengeStages = ["PHASE_1", "PHASE_2", "FUNDED"] as const;
export const payoutStatuses = ["PENDING", "APPROVED", "PAID", "REJECTED", "CANCELLED"] as const;
export const ticketStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
export const paymentStatuses = ["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"] as const;
export const payoutMethods = ["MANUAL", "BANK", "CRYPTO", "CARD"] as const;
export const topUpMethods = ["MANUAL", "BANK", "CRYPTO", "CARD"] as const;
export const topUpStatuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;
export const manualFundingAccountTypes = ["CRYPTO", "BANK", "WALLET"] as const;
export const couponCategories = ["CHALLENGE", "TOPUP", "ALL"] as const;
export const kycStatuses = ["PENDING", "APPROVED", "REJECTED"] as const;
export const kycDocumentTypes = ["PICTURE_ID", "PASSPORT"] as const;
export const blogStatuses = ["DRAFT", "PUBLISHED"] as const;

function instructionBulletCount(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;
}

export const passwordStrengthRules = [
  { id: "length", label: "At least 8 characters", test: (password: string) => password.length >= 8 },
  { id: "lowercase", label: "One lowercase letter", test: (password: string) => /[a-z]/.test(password) },
  { id: "uppercase", label: "One uppercase letter", test: (password: string) => /[A-Z]/.test(password) },
  { id: "number", label: "One number", test: (password: string) => /\d/.test(password) },
  { id: "symbol", label: "One special character", test: (password: string) => /[^A-Za-z0-9]/.test(password) }
] as const;

export function getPasswordStrength(password: string) {
  const rules = passwordStrengthRules.map((rule) => ({ id: rule.id, label: rule.label, passed: rule.test(password) }));
  const score = rules.filter((rule) => rule.passed).length;
  const percent = Math.round((score / passwordStrengthRules.length) * 100);
  const label = score <= 1 ? "Weak" : score <= 3 ? "Medium" : score === 4 ? "Strong" : "Very strong";

  return {
    score,
    maxScore: passwordStrengthRules.length,
    percent,
    label,
    rules
  };
}

export function isStrongPassword(password: string) {
  return getPasswordStrength(password).score === passwordStrengthRules.length;
}

export const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(24, "Username must be 24 characters or fewer")
    .regex(/^[A-Za-z0-9_]+$/, "Username can only use letters, numbers, and underscores"),
  email: z.string().email(),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number is required")
    .max(24, "Phone number is too long")
    .regex(/^\+?[0-9\s().-]+$/, "Enter a valid phone number"),
  country: z.string().trim().length(2, "Select your country"),
  avatarUrl: z.string().max(750_000, "Avatar image is too large").or(z.literal("")).optional(),
  registrationDeviceId: z.string().trim().min(16, "Device registration could not be verified"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .refine(isStrongPassword, "Use a stronger password with uppercase, lowercase, number, and symbol"),
  referralCode: z.string().trim().optional(),
  acceptedTerms: z.boolean().refine((value) => value, "You must agree to the terms and conditions")
});

export const loginSchema = z
  .object({
    identifier: z.string().trim().min(3, "Enter your email or username").optional(),
    email: z.string().trim().min(3, "Enter your email or username").optional(),
    password: z.string().min(1, "Password is required"),
    deviceId: z.string().trim().min(8).max(120).optional()
  })
  .superRefine((value, context) => {
    if (value.identifier || value.email) return;
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter your email or username",
      path: ["identifier"]
    });
  })
  .transform((value) => ({
    identifier: value.identifier ?? value.email ?? "",
    password: value.password,
    deviceId: value.deviceId
  }));

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit verification code")
});

export const resendVerificationSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{4}$/, "Enter the 4-digit reset code"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .refine(isStrongPassword, "Use a stronger password with uppercase, lowercase, number, and symbol")
});

export const profileSettingsSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required").max(80, "Name is too long").optional(),
    email: z.string().trim().email("Enter a valid email").optional(),
    phone: z
      .string()
      .trim()
      .min(7, "Phone number is too short")
      .max(24, "Phone number is too long")
      .regex(/^\+?[0-9\s().-]+$/, "Enter a valid phone number")
      .or(z.literal(""))
      .optional(),
    avatarUrl: z.string().max(750_000, "Avatar image is too large").or(z.literal("")).optional(),
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine(isStrongPassword, "Use a stronger password with uppercase, lowercase, number, and symbol")
      .optional()
  })
  .superRefine((value, context) => {
    if (value.newPassword && !value.currentPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Current password is required to change password",
        path: ["currentPassword"]
      });
    }
  });

export const challengeSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  accountSize: z.coerce.number().positive(),
  price: z.coerce.number().positive(),
  profitTargetPercent: z.coerce.number().positive(),
  dailyDrawdownPercent: z.coerce.number().positive(),
  maxDrawdownPercent: z.coerce.number().positive(),
  minTradingDays: z.coerce.number().int().positive(),
  leverage: z.string().min(2),
  phaseCount: z.coerce.number().int().min(0).max(3),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().optional()
});

export const orderSchema = z.object({
  challengeId: z.string().min(1),
  couponCode: z.string().trim().optional(),
  paymentMethod: z.enum(["TOPUP_BALANCE", "BANK", "CRYPTO", "CARD"]).default("TOPUP_BALANCE")
});

export const assignTradingAccountSchema = z.object({
  userId: z.string().min(1),
  challengeId: z.string().min(1),
  orderId: z.string().optional(),
  platform: z.enum(tradingPlatforms).default("MT5"),
  login: z.string().min(3),
  password: z.string().optional(),
  investorPassword: z.string().optional(),
  server: z.string().min(2),
  serverLink: z.string().url("Enter a valid server link").optional().or(z.literal(""))
});

export const tradingAccountApplicationSchema = z.object({
  orderId: z.string().min(1, "Select a paid challenge order"),
  platforms: z.array(z.enum(tradingPlatforms)).min(1, "Select at least one platform").max(2),
  stage: z.enum(challengeStages).default("PHASE_1")
});

export const tradingAccountCredentialSchema = z.object({
  login: z.string().trim().min(3, "Login/server number is required"),
  server: z.string().trim().min(2, "Server name is required"),
  password: z.string().trim().min(3, "Password is required"),
  investorPassword: z.string().trim().optional().or(z.literal("")),
  serverLink: z.string().trim().url("Enter a valid server link").optional().or(z.literal(""))
});

export const tradingAccountManualStatsSchema = z.object({
  balance: z.coerce.number().nonnegative("Balance cannot be negative").optional(),
  equity: z.coerce.number().nonnegative("Equity cannot be negative").optional(),
  dailyDrawdown: z.coerce.number().min(0, "Daily drawdown cannot be negative").optional(),
  maxDrawdown: z.coerce.number().min(0, "Max drawdown cannot be negative").optional(),
  openTrades: z.coerce.number().int().min(0).optional(),
  closedTrades: z.coerce.number().int().min(0).optional(),
  status: z.enum(accountStatuses).optional(),
  note: z.string().trim().max(500, "Note is too long").optional().or(z.literal(""))
});

export const payoutRequestSchema = z.object({
  tradingAccountId: z.string().optional(),
  amount: z.coerce.number().positive(),
  method: z.enum(payoutMethods).default("MANUAL"),
  walletAddress: z.string().optional(),
  bankDetails: z.string().optional()
});

export const topUpRequestSchema = z.object({
  amount: z.coerce.number().positive("Top-up amount must be greater than zero"),
  method: z.enum(topUpMethods).default("MANUAL"),
  manualFundingAccountId: z.string().trim().min(1, "Select a manual funding account"),
  transactionId: z.string().trim().min(3, "Transaction ID is required").max(160, "Transaction ID is too long"),
  reference: z.string().trim().max(120, "Reference is too long").optional().or(z.literal("")),
  proofUrl: z.string().min(1, "Receipt is required").max(8_000_000, "Receipt attachment is too large")
});

export const manualFundingAccountSchema = z.object({
  label: z.string().trim().min(2, "Account label is required").max(80, "Account label is too long"),
  accountType: z.enum(manualFundingAccountTypes),
  asset: z.string().trim().max(30, "Asset name is too long").optional().or(z.literal("")),
  network: z.string().trim().max(40, "Network name is too long").optional().or(z.literal("")),
  accountIdentifier: z.string().trim().min(3, "Account identifier is required").max(240, "Account identifier is too long"),
  holderName: z.string().trim().max(80, "Holder name is too long").optional().or(z.literal("")),
  instructions: z
    .string()
    .trim()
    .min(1, "Add 3-5 instruction bullets")
    .max(500, "Instructions are too long")
    .refine((value) => instructionBulletCount(value) >= 3 && instructionBulletCount(value) <= 5, "Add 3-5 instruction bullets, one per line"),
  imageUrl: z.string().max(750_000, "Method image is too large").optional().or(z.literal("")),
  processingTime: z.string().trim().min(2, "Processing time is required").max(80, "Processing time is too long"),
  minAmount: z.coerce.number().min(0, "Minimum amount cannot be negative").default(0),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0)
});

export const kycSubmissionSchema = z.object({
  firstName: z.string().trim().min(2, "First name is required").max(60, "First name is too long"),
  lastName: z.string().trim().min(2, "Last name is required").max(60, "Last name is too long"),
  middleName: z.string().trim().max(60, "Middle name is too long").optional().or(z.literal("")),
  address: z.string().trim().min(10, "Enter your full residential address").max(240, "Address is too long"),
  documentType: z.enum(kycDocumentTypes),
  documentFrontUrl: z.string().max(8_000_000, "Front document image is too large"),
  documentBackUrl: z.string().max(8_000_000, "Back document image is too large"),
  acceptedPolicies: z.boolean().refine((value) => value, "You must accept KYC policy, privacy policy, and terms")
});

export const supportTicketSchema = z.object({
  subject: z.string().min(4),
  category: z.string().min(2),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  message: z.string().min(5),
  attachments: z.array(z.string().max(8_000_000, "Attachment is too large")).max(4).optional()
});

const commaList = z
  .union([z.array(z.string()), z.string()])
  .optional()
  .transform((value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  });

export const blogImageSchema = z.object({
  imageUrl: z.string().min(1, "Image URL is required").max(8_000_000, "Image is too large"),
  title: z.string().trim().max(120, "Image title is too long").optional().or(z.literal("")),
  caption: z.string().trim().max(240, "Image caption is too long").optional().or(z.literal("")),
  altText: z.string().trim().max(160, "Alt text is too long").optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).default(0)
});

export const blogVideoSchema = z.object({
  videoUrl: z.string().trim().min(1, "Video is required").max(80_000_000, "Video is too large"),
  title: z.string().trim().max(120, "Video title is too long").optional().or(z.literal("")),
  caption: z.string().trim().max(240, "Video caption is too long").optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).default(0)
});

export const blogAttachmentSchema = z.object({
  fileUrl: z.string().trim().min(1, "Attachment is required").max(80_000_000, "Attachment is too large"),
  title: z.string().trim().max(140, "Attachment title is too long").optional().or(z.literal("")),
  contentType: z.string().trim().max(80, "Content type is too long").optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).default(0)
});

export const blogSectionSchema = z.object({
  heading: z.string().trim().min(2, "Section heading is required").max(180, "Section heading is too long"),
  content: z.string().trim().min(1, "Section content is required"),
  imageUrl: z.string().max(8_000_000, "Section image is too large").optional().or(z.literal("")),
  videos: z.array(blogVideoSchema).max(2, "Maximum 2 section videos allowed").optional().default([]),
  order: z.coerce.number().int().min(0).default(0)
});

export const blogSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(180, "Title is too long"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(180, "Slug is too long")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a clean URL slug"),
  shortDescription: z.string().trim().min(10, "Short description is required").max(300, "Short description is too long"),
  description: z.string().trim().min(10, "Description is required"),
  content: z.string().trim().min(10, "Full content is required"),
  category: z.string().trim().max(80, "Category is too long").optional().or(z.literal("")),
  tags: commaList,
  keywords: commaList,
  status: z.enum(blogStatuses).default("DRAFT"),
  referenceCtaText: z.string().trim().max(80, "CTA text is too long").optional().or(z.literal("")),
  referenceCtaUrl: z.string().trim().url("Enter a valid CTA URL").optional().or(z.literal("")),
  seoTitle: z.string().trim().max(180, "SEO title is too long").optional().or(z.literal("")),
  seoDescription: z.string().trim().max(300, "SEO description is too long").optional().or(z.literal("")),
  seoKeywords: commaList,
  canonicalUrl: z.string().trim().url("Enter a valid canonical URL").optional().or(z.literal("")),
  authorName: z.string().trim().max(100, "Author name is too long").optional().or(z.literal("")),
  publishedAt: z.string().trim().datetime().optional().or(z.literal("")),
  images: z.array(blogImageSchema).min(2, "Add at least 2 blog images").max(5, "Maximum 5 blog images allowed"),
  videos: z.array(blogVideoSchema).max(2, "Maximum 2 videos allowed").optional().default([]),
  attachments: z.array(blogAttachmentSchema).max(5, "Maximum 5 attachments allowed").optional().default([]),
  sections: z.array(blogSectionSchema).optional().default([])
});

export const blogStatusSchema = z.object({
  status: z.enum(blogStatuses)
});

export const blogCommentSchema = z.object({
  content: z.string().trim().min(1, "Comment is required").max(5000, "Comment is too long"),
  parentId: z.string().trim().optional().or(z.literal("")),
  isAnonymous: z.boolean().default(false),
  displayName: z.string().trim().max(80, "Display name is too long").optional().or(z.literal("")),
  images: z.array(z.string().max(8_000_000, "Comment image is too large")).max(4, "Maximum 4 comment images allowed").optional().default([])
});

export const reactionSchema = z.object({
  type: z.enum(["LIKE", "DISLIKE"])
});

export const ticketReplySchema = z.object({
  message: z.string().min(1).optional(),
  attachments: z.array(z.string().max(8_000_000, "Attachment is too large")).max(4).optional()
}).superRefine((value, context) => {
  if (value.message?.trim() || value.attachments?.length) return;
  context.addIssue({
    code: z.ZodIssueCode.custom,
    message: "Message or attachment is required",
    path: ["message"]
  });
});

export const statusSchema = z.object({
  status: z.string().min(2),
  note: z.string().optional()
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
export type ChallengeInput = z.infer<typeof challengeSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type AssignTradingAccountInput = z.infer<typeof assignTradingAccountSchema>;
export type TradingAccountApplicationInput = z.infer<typeof tradingAccountApplicationSchema>;
export type TradingAccountCredentialInput = z.infer<typeof tradingAccountCredentialSchema>;
export type TradingAccountManualStatsInput = z.infer<typeof tradingAccountManualStatsSchema>;
export type PayoutRequestInput = z.infer<typeof payoutRequestSchema>;
export type TopUpRequestInput = z.infer<typeof topUpRequestSchema>;
export type ManualFundingAccountInput = z.infer<typeof manualFundingAccountSchema>;
export type KycSubmissionInput = z.infer<typeof kycSubmissionSchema>;
export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
export type BlogInput = z.infer<typeof blogSchema>;
export type BlogCommentInput = z.infer<typeof blogCommentSchema>;
