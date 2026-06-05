"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { getPasswordStrength, isStrongPassword } from "@pipnest/shared";
import { ArrowRight, AtSign, Camera, CheckCircle2, ChevronDown, ChevronUp, Circle, Globe2, ImageIcon, Info, Loader2, Mail, Phone, UserRound, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { SwitchField } from "@/components/ui/switch-field";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { countries, detectCountryCode, getOrCreateRegistrationDeviceId, getOrCreateTrustedDeviceId } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { getStoredAuthToken, useAuthStore } from "@/store/auth-store";

const loginSchema = z.object({
  email: z.string().trim().min(3, "Enter your email or username"),
  password: z.string().min(1, "Password is required")
});

const registerSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(24, "Username must be 24 characters or fewer")
    .regex(/^[A-Za-z0-9_]+$/, "Username can only use letters, numbers, and underscores"),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number is required")
    .max(16, "Phone number is too long")
    .regex(/^\d+$/, "Use numbers only"),
  country: z.string().length(2, "Select your country"),
  avatarUrl: z.string().max(750_000, "Avatar image is too large").or(z.literal("")).optional(),
  registrationDeviceId: z.string().min(16, "Device registration could not be verified"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .refine(isStrongPassword, "Use a stronger password with uppercase, lowercase, number, and symbol"),
  referralCode: z.string().optional(),
  acceptedTerms: z.boolean().refine((value) => value, "You must agree to the terms")
});

type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    username?: string | null;
    phone?: string | null;
    country?: string | null;
    avatarUrl?: string | null;
    referralCode?: string | null;
    status?: "PENDING" | "APPROVED";
    role: "TRADER" | "ADMIN" | "SUPER_ADMIN";
    permissions?: string[];
  };
  twoFactorRequired?: false;
};

type TwoFactorRequiredResponse = {
  twoFactorRequired: true;
  twoFactorToken: string;
  email: string;
  message: string;
};

type RegisterResponse = {
  verificationRequired: true;
  email: string;
  emailSent?: boolean;
  message: string;
};

type LoginValues = { identifier: string; password: string; deviceId: string };
type RegisterValues = z.infer<typeof registerSchema>;
type AuthFormValues = {
  name: string;
  username: string;
  email: string;
  phone: string;
  country: string;
  avatarUrl: string;
  registrationDeviceId: string;
  password: string;
  referralCode: string;
  acceptedTerms: boolean;
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function PasswordRulesTooltip({ rules }: { rules: ReturnType<typeof getPasswordStrength>["rules"] }) {
  return (
    <span className="group/rules relative inline-flex">
      <button
        type="button"
        aria-label="Show password rules"
        className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-primary/40 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      <span className="pointer-events-none absolute right-0 top-9 z-30 w-72 max-w-[calc(100vw-3rem)] rounded-md border border-slate-200 bg-white p-3 text-xs font-medium text-slate-600 opacity-0 shadow-[0_18px_45px_rgba(15,23,42,0.18)] transition group-hover/rules:opacity-100 group-focus-within/rules:opacity-100 sm:-right-[9rem] dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
        <span className="grid gap-2">
          {rules.map((rule) => {
            const Icon = rule.passed ? CheckCircle2 : Circle;

            return (
              <span key={rule.id} className={cn("flex items-center gap-2", rule.passed && "text-profit")}>
                <Icon className="h-3.5 w-3.5" />
                {rule.label}
              </span>
            );
          })}
        </span>
      </span>
    </span>
  );
}

type AvailabilityState = {
  status: "idle" | "loading" | "available" | "taken";
  message: string;
};

function IdentityStatusIcon({ state, label }: { state: AvailabilityState; label: string }) {
  if (state.status === "idle") return null;

  const Icon = state.status === "loading" ? Loader2 : state.status === "available" ? CheckCircle2 : XCircle;
  const tone =
    state.status === "loading"
      ? "text-slate-400"
      : state.status === "available"
        ? "text-profit"
        : "text-loss";

  return (
    <span className="group/status absolute right-3 top-1/2 z-20 -translate-y-1/2">
      <Icon className={cn("h-4 w-4", tone, state.status === "loading" && "animate-spin")} />
      <span className="pointer-events-none absolute right-0 top-7 z-30 w-52 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 opacity-0 shadow-[0_14px_36px_rgba(15,23,42,0.18)] transition group-hover/status:opacity-100 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
        {state.message || `${label} check`}
      </span>
    </span>
  );
}

function countryFlagSrc(code: string) {
  return `https://flagcdn.com/${code.toLowerCase()}.svg`;
}

function CountryFlagImage({ code, name }: { code: string; name: string }) {
  return (
    <span className="grid h-4 w-6 shrink-0 place-items-center overflow-hidden rounded-[3px] border border-slate-200 bg-slate-100 shadow-sm dark:border-white/10 dark:bg-white/10">
      <img
        src={countryFlagSrc(code)}
        alt={`${name} flag`}
        loading="lazy"
        className="h-full w-full object-cover"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    </span>
  );
}

function CountryPicker({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<number | null>(null);
  const selectedCountry = countries.find((country) => country.code === value) ?? countries.find((country) => country.code === "US") ?? countries[0];

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function stopScroll() {
    if (scrollTimerRef.current) window.clearInterval(scrollTimerRef.current);
    scrollTimerRef.current = null;
  }

  function startScroll(direction: -1 | 1) {
    stopScroll();
    scrollTimerRef.current = window.setInterval(() => {
      listRef.current?.scrollBy({ top: direction * 14 });
    }, 16);
  }

  useEffect(() => stopScroll, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-slate-300/30 bg-white px-3 text-left text-sm font-semibold text-slate-950 outline-none transition hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/10 dark:text-white"
      >
        <span className="flex min-w-0 items-center gap-2">
          <CountryFlagImage code={selectedCountry.code} name={selectedCountry.name} />
          <span className="truncate">{selectedCountry.name}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
          {selectedCountry.dialCode}
          <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-50 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.24)] sm:w-full sm:min-w-[18rem] dark:border-white/10 dark:bg-slate-950">
          <button
            type="button"
            onMouseEnter={() => startScroll(-1)}
            onMouseLeave={stopScroll}
            onClick={() => listRef.current?.scrollBy({ top: -110, behavior: "smooth" })}
            className="grid h-7 w-full place-items-center border-b border-slate-100 text-slate-400 transition hover:bg-slate-50 hover:text-primary dark:border-white/10 dark:hover:bg-white/10"
            aria-label="Scroll countries up"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <div ref={listRef} className="max-h-60 overflow-y-auto py-1">
            {countries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  onChange(country.code);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-semibold transition hover:bg-slate-100 dark:hover:bg-white/10",
                  country.code === selectedCountry.code && "bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-200"
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <CountryFlagImage code={country.code} name={country.name} />
                  <span className="truncate">{country.name}</span>
                </span>
                <span className="shrink-0 text-xs text-slate-500 dark:text-slate-300">{country.dialCode}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onMouseEnter={() => startScroll(1)}
            onMouseLeave={stopScroll}
            onClick={() => listRef.current?.scrollBy({ top: 110, behavior: "smooth" })}
            className="grid h-7 w-full place-items-center border-t border-slate-100 text-slate-400 transition hover:bg-slate-50 hover:text-primary dark:border-white/10 dark:hover:bg-white/10"
            aria-label="Scroll countries down"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pushToast = useToast((state) => state.push);
  const setAuth = useAuthStore((state) => state.setAuth);
  const hydrate = useAuthStore((state) => state.hydrate);
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const [loading, setLoading] = useState(false);
  const referralFromUrl = useMemo(() => searchParams?.get("ref") ?? searchParams?.get("referral") ?? "", [searchParams]);
  const [usernameAvailability, setUsernameAvailability] = useState<AvailabilityState>({ status: "idle", message: "" });
  const [phoneAvailability, setPhoneAvailability] = useState<AvailabilityState>({ status: "idle", message: "" });
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(mode === "login" ? loginSchema : registerSchema),
    defaultValues:
      mode === "login"
        ? { name: "", username: "", email: "", phone: "", country: "", avatarUrl: "", registrationDeviceId: "", password: "", referralCode: "", acceptedTerms: false }
        : { name: "", username: "", email: "", phone: "", country: "", avatarUrl: "", registrationDeviceId: "", password: "", referralCode: referralFromUrl, acceptedTerms: false }
  });

  useEffect(() => {
    hydrate("user");
    if ((scope === "user" && token) || getStoredAuthToken("user")) router.replace("/dashboard");
  }, [hydrate, router, scope, token]);

  useEffect(() => {
    if (mode === "register" && referralFromUrl) {
      form.setValue("referralCode", referralFromUrl);
    }
  }, [form, mode, referralFromUrl]);

  useEffect(() => {
    if (mode !== "register") return;
    form.setValue("registrationDeviceId", getOrCreateRegistrationDeviceId());
    form.setValue("country", form.getValues("country") || detectCountryCode());
  }, [form, mode]);

  const selectedCountryCode = mode === "register" ? form.watch("country") : "";
  const selectedCountry = useMemo(() => countries.find((country) => country.code === selectedCountryCode), [selectedCountryCode]);
  const selectedDialCode = selectedCountry?.dialCode;
  const usernameValue = mode === "register" ? form.watch("username") : "";
  const phoneValue = mode === "register" ? form.watch("phone") : "";
  const phoneDigits = useMemo(() => phoneValue.replace(/\D/g, ""), [phoneValue]);

  useEffect(() => {
    if (mode !== "register") return;

    const username = usernameValue.trim().toLowerCase();
    if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) {
      setUsernameAvailability({ status: "idle", message: "" });
      return;
    }

    let active = true;
    setUsernameAvailability({ status: "loading", message: "Checking username" });
    const timer = window.setTimeout(() => {
      apiFetch<{ username?: { available: boolean; message: string } }>(`/auth/availability?username=${encodeURIComponent(username)}`)
        .then((data) => {
          if (!active) return;
          setUsernameAvailability({
            status: data.username?.available ? "available" : "taken",
            message: data.username?.message ?? "Username check complete"
          });
        })
        .catch(() => {
          if (!active) return;
          setUsernameAvailability({ status: "idle", message: "" });
        });
    }, 450);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [mode, usernameValue]);

  useEffect(() => {
    if (mode !== "register" || !selectedDialCode) return;

    if (phoneDigits.length < 7) {
      setPhoneAvailability({ status: "idle", message: "" });
      return;
    }

    let active = true;
    const fullPhone = `${selectedDialCode} ${phoneDigits}`;
    setPhoneAvailability({ status: "loading", message: "Checking phone number" });
    const timer = window.setTimeout(() => {
      apiFetch<{ phone?: { available: boolean; message: string } }>(`/auth/availability?phone=${encodeURIComponent(fullPhone)}`)
        .then((data) => {
          if (!active) return;
          setPhoneAvailability({
            status: data.phone?.available ? "available" : "taken",
            message: data.phone?.message ?? "Phone check complete"
          });
        })
        .catch(() => {
          if (!active) return;
          setPhoneAvailability({ status: "idle", message: "" });
        });
    }, 450);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [mode, phoneDigits, selectedDialCode]);

  async function handleAvatar(file?: File) {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    if (dataUrl.length > 750_000) {
      pushToast({
        title: "Avatar image is too large",
        message: "Please choose a smaller image for now.",
        tone: "error"
      });
      return;
    }
    form.setValue("avatarUrl", dataUrl, { shouldDirty: true, shouldValidate: true });
  }

  async function onSubmit(values: AuthFormValues) {
    setLoading(true);

    try {
      if (mode === "login") {
        if (twoFactorToken) {
          const data = await apiFetch<AuthResponse>("/auth/2fa/login", {
            method: "POST",
            body: JSON.stringify({ twoFactorToken, code: twoFactorCode, deviceId: getOrCreateTrustedDeviceId() })
          });
          setAuth(data.token, data.user, { remember: true, scope: "user" });
          pushToast({
            title: "Login successful",
            message: "Welcome to your trader dashboard.",
            tone: "success"
          });
          router.replace("/dashboard");
          return;
        }

        const payload: LoginValues = { identifier: values.email, password: values.password, deviceId: getOrCreateTrustedDeviceId() };
        const data = await apiFetch<AuthResponse | TwoFactorRequiredResponse>("/auth/login", {
          method: "POST",
          body: JSON.stringify(payload)
        });

        if (data.twoFactorRequired) {
          setTwoFactorToken(data.twoFactorToken);
          setTwoFactorCode("");
          pushToast({
            title: "Authenticator code required",
            message: data.message,
            tone: "info"
          });
          return;
        }

        setAuth(data.token, data.user, { remember: true, scope: "user" });
        pushToast({
          title: "Login successful",
          message: "Welcome to your trader dashboard.",
          tone: "success"
        });
        router.replace("/dashboard");
        return;
      }

      if (usernameAvailability.status === "loading" || phoneAvailability.status === "loading") {
        throw new Error("Please wait while we check username and phone availability.");
      }
      if (usernameAvailability.status === "taken" || phoneAvailability.status === "taken") {
        throw new Error("Please choose an available username and phone number.");
      }

      const fullPhone = `${selectedDialCode ?? ""} ${values.phone.replace(/\D/g, "")}`.trim();
      const payload: RegisterValues = {
        name: values.name,
        username: values.username,
        email: values.email,
        phone: fullPhone,
        country: values.country,
        avatarUrl: values.avatarUrl,
        registrationDeviceId: values.registrationDeviceId,
        password: values.password,
        referralCode: values.referralCode,
        acceptedTerms: values.acceptedTerms
      };
      const data = await apiFetch<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      pushToast({
        title: "Account created",
        message: data.message,
        tone: "success"
      });
      router.replace(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      pushToast({
        title: mode === "login" ? "Login failed" : "Registration failed",
        message: error instanceof Error ? error.message : "Please check the form and try again.",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  const acceptedTerms = mode === "register" ? Boolean(form.watch("acceptedTerms")) : false;
  const passwordValue = form.watch("password");
  const avatarUrl = mode === "register" ? form.watch("avatarUrl") : "";
  const passwordStrength = useMemo(() => getPasswordStrength(mode === "register" ? passwordValue : ""), [mode, passwordValue]);
  const strengthColor =
    passwordStrength.score <= 1
      ? "bg-loss"
      : passwordStrength.score <= 3
        ? "bg-warning"
        : passwordStrength.score === 4
          ? "bg-primary"
          : "bg-profit";
  const usernameField = form.register("username");
  const phoneField = form.register("phone");
  const showErrors = form.formState.isSubmitted;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={cn("grid", mode === "register" ? "gap-3" : "gap-4")}>
      {mode === "register" ? (
        <div className="grid gap-3 sm:grid-cols-[6.75rem_minmax(0,1fr)_minmax(0,1fr)]">
          <label className="group/avatar relative flex h-[6.75rem] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50 text-center transition hover:border-primary/50 hover:bg-blue-50 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-primary/10">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <>
                <ImageIcon className="h-6 w-6 text-slate-400" />
                <span className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-300">Avatar</span>
              </>
            )}
            <span className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-primary text-white shadow-lg transition group-hover/avatar:scale-105">
              <Camera className="h-4 w-4" />
            </span>
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => handleAvatar(event.target.files?.[0])} />
          </label>

          <label className="grid content-start gap-2 text-sm font-semibold">
            Full name
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input className="pl-9" placeholder="Ayesha Khan" autoComplete="name" {...form.register("name")} />
            </div>
            {showErrors && form.formState.errors.name ? <span className="text-xs text-loss">{form.formState.errors.name.message}</span> : null}
          </label>

          <label className="grid content-start gap-2 text-sm font-semibold">
            Username
            <div className="relative">
              <AtSign className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                className="pl-9 pr-9"
                placeholder="hash24"
                autoComplete="username"
                {...usernameField}
                onChange={(event) => {
                  usernameField.onChange(event);
                  setUsernameAvailability({ status: "idle", message: "" });
                }}
              />
              <IdentityStatusIcon state={usernameAvailability} label="Username" />
            </div>
            {showErrors && form.formState.errors.username ? <span className="text-xs text-loss">{form.formState.errors.username.message}</span> : null}
          </label>
        </div>
      ) : null}

      <label className="grid gap-2 text-sm font-semibold">
        {mode === "login" ? "Email or username" : "Email"}
        <div className="relative">
          {mode === "login" ? <AtSign className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /> : <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />}
          <Input
            className="pl-9"
            placeholder={mode === "login" ? "email or username" : "trader@pipnestfunding.com"}
            autoComplete={mode === "login" ? "username" : "email"}
            {...form.register("email")}
          />
        </div>
        {showErrors && form.formState.errors.email ? <span className="text-xs text-loss">{form.formState.errors.email.message}</span> : null}
      </label>

      {mode === "register" ? (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <label className="grid gap-2 text-sm font-semibold">
            Phone number
            <div className="relative flex h-10 overflow-visible rounded-md border border-slate-300/30 bg-white text-sm text-slate-950 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 dark:bg-white/10 dark:text-white">
              <span className="inline-flex min-w-[4.65rem] items-center justify-center gap-1 border-r border-slate-200 px-2 text-xs font-bold text-slate-500 dark:border-white/10 dark:text-slate-300">
                <Phone className="h-3.5 w-3.5" />
                {selectedDialCode ?? "+1"}
              </span>
              <input
                className="min-w-0 flex-1 bg-transparent px-3 pr-9 text-sm outline-none placeholder:text-slate-400"
                placeholder="3000000000"
                autoComplete="tel-national"
                inputMode="numeric"
                {...phoneField}
                onChange={(event) => {
                  event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 16);
                  phoneField.onChange(event);
                  setPhoneAvailability({ status: "idle", message: "" });
                }}
              />
              <IdentityStatusIcon state={phoneAvailability} label="Phone number" />
            </div>
            {showErrors && form.formState.errors.phone ? <span className="text-xs text-loss">{form.formState.errors.phone.message}</span> : null}
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Country
            <div className="relative">
              <Globe2 className="pointer-events-none absolute left-3 top-3 z-10 h-4 w-4 text-slate-400" />
              <div className="pl-8">
                <CountryPicker
                  value={selectedCountryCode}
                  onChange={(countryCode) =>
                    form.setValue("country", countryCode, {
                      shouldDirty: true,
                      shouldValidate: form.formState.isSubmitted
                    })
                  }
                />
              </div>
            </div>
            {showErrors && form.formState.errors.country ? <span className="text-xs text-loss">{form.formState.errors.country.message}</span> : null}
          </label>
        </div>
      ) : null}

      <label className="grid gap-2 text-sm font-semibold">
        Password
        <PasswordInput placeholder={mode === "register" ? "Create a strong password" : "Enter your password"} autoComplete={mode === "login" ? "current-password" : "new-password"} {...form.register("password")} />
        {showErrors && form.formState.errors.password ? <span className="text-xs text-loss">{form.formState.errors.password.message}</span> : null}
      </label>

      {mode === "login" && twoFactorToken ? (
        <label className="grid gap-2 text-sm font-semibold">
          Authenticator code
          <Input
            value={twoFactorCode}
            onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
          />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Open your authenticator app and enter the current code.</span>
        </label>
      ) : null}

      {mode === "register" ? (
        <>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                Password strength
                <PasswordRulesTooltip rules={passwordStrength.rules} />
              </span>
              <span className={cn("rounded-full px-2 py-1", passwordStrength.score === passwordStrength.maxScore ? "bg-profit/10 text-profit" : "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300")}>
                {passwordValue ? passwordStrength.label : "Required"}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <span className={cn("block h-full rounded-full transition-all", strengthColor)} style={{ width: `${passwordValue ? passwordStrength.percent : 0}%` }} />
            </div>
          </div>

          <label className="grid gap-2 text-sm font-semibold">
            Referral code
            <Input placeholder="Optional referral code" {...form.register("referralCode")} />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Optional. If entered, it must belong to an existing user.</span>
          </label>

          <SwitchField
            checked={acceptedTerms}
            onChange={(checked) => form.setValue("acceptedTerms", checked, { shouldDirty: true, shouldValidate: form.formState.isSubmitted })}
            label="I agree to the terms and conditions"
            description="Required before creating your account."
          />
          <p className="-mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            Read the <Link href="/terms" className="text-primary hover:underline">Terms</Link> and{" "}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
          {showErrors && form.formState.errors.acceptedTerms ? <span className="-mt-2 text-xs text-loss">{form.formState.errors.acceptedTerms.message}</span> : null}
        </>
      ) : null}

      <Button type="submit" className="mt-2 w-full" disabled={loading || (mode === "login" && Boolean(twoFactorToken) && twoFactorCode.length !== 6)}>
        {loading ? (mode === "login" ? "Signing in" : "Creating account") : mode === "login" ? (twoFactorToken ? "Verify Code" : "Login") : "Create Account"}
        {!loading ? <ArrowRight className="h-4 w-4" /> : null}
      </Button>
    </form>
  );
}
