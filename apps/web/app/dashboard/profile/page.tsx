"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Camera, Copy, KeyRound, Loader2, LockKeyhole, Mail, Phone, QrCode, ShieldCheck, UserRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { SwitchField } from "@/components/ui/switch-field";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { isRememberedAuth, useAuthStore, type AuthUser } from "@/store/auth-store";

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  twoFactorEnabled: boolean;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type TwoFactorSetup = {
  secret: string;
  otpauthUrl: string;
  message: string;
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const source = String(reader.result);
      const image = new Image();
      image.onload = () => {
        const maxSide = 512;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.onerror = () => resolve(source);
      image.src = source;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function initialsFor(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function ProfileSettingsPage() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const pushToast = useToast((state) => state.push);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [twoFactorSaving, setTwoFactorSaving] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [disableTwoFactorCode, setDisableTwoFactorCode] = useState("");
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: "",
    email: "",
    phone: "",
    avatarUrl: "",
    twoFactorEnabled: false
  });
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    hydrate("user");
  }, [hydrate]);

  useEffect(() => {
    if (scope !== "user" || !token) return;

    apiFetch<{ user: AuthUser }>("/auth/me", { token })
      .then((data) => {
        setAuth(token, data.user, { remember: isRememberedAuth("user"), scope: "user" });
      })
      .catch(() => undefined);
  }, [scope, setAuth, token]);

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      avatarUrl: user.avatarUrl ?? "",
      twoFactorEnabled: Boolean(user.twoFactorEnabled)
    });
  }, [user]);

  const initials = useMemo(() => initialsFor(profileForm.name || user?.name || "PN") || "PN", [profileForm.name, user?.name]);
  const verified = user?.kycStatus === "APPROVED";
  const qrCodeUrl = twoFactorSetup
    ? `https://api.qrserver.com/v1/create-qr-code/?size=210x210&data=${encodeURIComponent(twoFactorSetup.otpauthUrl)}`
    : "";

  async function handleAvatar(file?: File) {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    if (dataUrl.length > 750_000) {
      pushToast({
        title: "Avatar image is too large",
        message: "Please choose a smaller image.",
        tone: "error"
      });
      return;
    }
    setProfileForm((current) => ({ ...current, avatarUrl: dataUrl }));
  }

  function updateProfileField<Key extends keyof ProfileForm>(key: Key, value: ProfileForm[Key]) {
    setProfileForm((current) => ({ ...current, [key]: value }));
  }

  function updatePasswordField<Key extends keyof PasswordForm>(key: Key, value: PasswordForm[Key]) {
    setPasswordForm((current) => ({ ...current, [key]: value }));
  }

  async function saveProfile() {
    if (!token) return;
    setProfileSaving(true);

    try {
      const data = await apiFetch<{ user: AuthUser; message: string }>("/auth/profile", {
        method: "PUT",
        token,
        body: JSON.stringify({
          name: profileForm.name.trim(),
          email: profileForm.email.trim(),
          phone: profileForm.phone.trim(),
          avatarUrl: profileForm.avatarUrl
        })
      });
      setAuth(token, data.user, { remember: isRememberedAuth("user"), scope: "user" });
      pushToast({ title: "Profile updated", message: data.message, tone: "success" });
    } catch (error) {
      pushToast({
        title: "Profile not updated",
        message: error instanceof Error ? error.message : "Please check your details and try again.",
        tone: "error"
      });
    } finally {
      setProfileSaving(false);
    }
  }

  async function startTwoFactorSetup() {
    if (!token) return;
    setTwoFactorSaving(true);

    try {
      const data = await apiFetch<TwoFactorSetup>("/auth/2fa/setup", {
        method: "POST",
        token
      });
      setTwoFactorSetup(data);
      setTwoFactorCode("");
      pushToast({ title: "Authenticator key ready", message: "Add the key to your authenticator app, then confirm the code.", tone: "success" });
    } catch (error) {
      pushToast({
        title: "2FA setup failed",
        message: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    } finally {
      setTwoFactorSaving(false);
    }
  }

  async function confirmTwoFactor() {
    if (!token) return;
    setTwoFactorSaving(true);

    try {
      const data = await apiFetch<{ user: AuthUser; message: string }>("/auth/2fa/confirm", {
        method: "POST",
        token,
        body: JSON.stringify({ code: twoFactorCode })
      });
      setAuth(token, data.user, { remember: isRememberedAuth("user"), scope: "user" });
      setTwoFactorSetup(null);
      setTwoFactorCode("");
      pushToast({ title: "2FA enabled", message: data.message, tone: "success" });
    } catch (error) {
      pushToast({
        title: "2FA not enabled",
        message: error instanceof Error ? error.message : "Enter the latest 6-digit code.",
        tone: "error"
      });
    } finally {
      setTwoFactorSaving(false);
    }
  }

  async function disableTwoFactor() {
    if (!token) return;
    setTwoFactorSaving(true);

    try {
      const data = await apiFetch<{ user: AuthUser; message: string }>("/auth/2fa/disable", {
        method: "POST",
        token,
        body: JSON.stringify({ code: disableTwoFactorCode })
      });
      setAuth(token, data.user, { remember: isRememberedAuth("user"), scope: "user" });
      setDisableTwoFactorCode("");
      pushToast({ title: "2FA disabled", message: data.message, tone: "success" });
    } catch (error) {
      pushToast({
        title: "2FA not disabled",
        message: error instanceof Error ? error.message : "Enter the latest 6-digit code.",
        tone: "error"
      });
    } finally {
      setTwoFactorSaving(false);
    }
  }

  async function savePassword() {
    if (!token) return;
    if (!passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword) {
      pushToast({
        title: "Password not updated",
        message: "New password and confirmation must match.",
        tone: "error"
      });
      return;
    }

    setPasswordSaving(true);

    try {
      const data = await apiFetch<{ user: AuthUser; message: string }>("/auth/profile", {
        method: "PUT",
        token,
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      setAuth(token, data.user, { remember: isRememberedAuth("user"), scope: "user" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      pushToast({ title: "Password updated", message: data.message, tone: "success" });
    } catch (error) {
      pushToast({
        title: "Password not updated",
        message: error instanceof Error ? error.message : "Please check your current password.",
        tone: "error"
      });
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Trader Settings" description="Manage profile, contact, avatar, password, and 2FA from one place." />

      <section className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_290px]">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
            <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-2xl font-black text-white shadow-sm dark:border-white/10 dark:bg-white dark:text-slate-950">
              {profileForm.avatarUrl ? <img src={profileForm.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
              {verified ? (
                <span className="absolute bottom-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-full bg-blue-600 text-white ring-2 ring-white dark:ring-slate-950">
                  <BadgeCheck className="h-4 w-4 fill-current" />
                </span>
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold">{profileForm.name || "Trader"}</h2>
                {verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-600 px-2.5 py-1 text-xs font-bold text-white">
                    <BadgeCheck className="h-3.5 w-3.5 fill-current" />
                    KYC Verified
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1 rounded-full border border-profit/20 bg-profit/10 px-2.5 py-1 text-xs font-bold text-green-700 dark:text-green-300">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {user?.status === "APPROVED" ? "Approved Account" : "Pending Account"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 dark:bg-white/10">
                  <Mail className="h-3.5 w-3.5" />
                  {profileForm.email || "No email"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 dark:bg-white/10">
                  <Phone className="h-3.5 w-3.5" />
                  {profileForm.phone || "No phone"}
                </span>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200 p-6 dark:border-white/10 lg:border-l lg:border-t-0">
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">Login protection</div>
            <div className="mt-3 flex items-center gap-3">
              <span className={cn("grid h-11 w-11 place-items-center rounded-md", profileForm.twoFactorEnabled ? "bg-profit/10 text-green-700 dark:text-green-300" : "bg-warning/10 text-amber-700 dark:text-amber-300")}>
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold">{profileForm.twoFactorEnabled ? "2FA enabled" : "2FA disabled"}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{profileForm.twoFactorEnabled ? "New devices need authenticator code." : "Add authenticator protection below."}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <label className="group/avatar relative grid h-28 w-28 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-center dark:border-white/10 dark:bg-white/[0.04]">
              {profileForm.avatarUrl ? (
                <img src={profileForm.avatarUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center bg-slate-950 text-2xl font-black text-white dark:bg-white dark:text-slate-950">
                  {initials}
                </span>
              )}
              <span className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-md bg-primary text-white shadow-lg transition group-hover/avatar:scale-105">
                <Camera className="h-4 w-4" />
              </span>
              <input type="file" accept="image/*" className="sr-only" onChange={(event) => handleAvatar(event.target.files?.[0])} />
            </label>

            <div className="grid flex-1 gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  Full name
                  <span className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input className="pl-9" value={profileForm.name} onChange={(event) => updateProfileField("name", event.target.value)} autoComplete="name" />
                  </span>
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  Email
                  <span className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type="email"
                      className="pl-9"
                      value={profileForm.email}
                      disabled
                      autoComplete="email"
                      placeholder="you@example.com"
                    />
                  </span>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  Phone number
                  <span className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type="tel"
                      className="pl-9"
                      value={profileForm.phone}
                      disabled
                      autoComplete="tel"
                      placeholder="e.g. +1234567890"
                    />
                  </span>
                </label>

                <div className="grid gap-2 text-sm font-semibold">
                  Two-factor authentication
                  <SwitchField
                    checked={profileForm.twoFactorEnabled}
                    onChange={() => {
                      if (profileForm.twoFactorEnabled) {
                        setDisableTwoFactorCode((current) => current || "");
                        return;
                      }
                      void startTwoFactorSetup();
                    }}
                    label={profileForm.twoFactorEnabled ? "Enabled" : "Disabled"}
                    description={profileForm.twoFactorEnabled ? "Code required at login" : "Set up authenticator app"}
                    className="h-10 py-2"
                    disabled={twoFactorSaving}
                  />
                </div>
              </div>

              {twoFactorSetup ? (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 dark:bg-primary/10">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <QrCode className="h-4 w-4" />
                    Authenticator setup
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Scan the QR code or copy the manual key in Google Authenticator, Microsoft Authenticator, Authy, or any TOTP app.</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)]">
                    <div className="grid place-items-center rounded-md border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950">
                      <img src={qrCodeUrl} alt="Authenticator QR code" className="h-40 w-40 rounded-md bg-white p-1" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                        <KeyRound className="h-3.5 w-3.5" />
                        Manual setup key
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white p-3 font-mono text-sm dark:border-white/10 dark:bg-slate-950">
                        <span className="break-all">{twoFactorSetup.secret}</span>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(twoFactorSetup.secret)}
                          className="grid h-8 w-8 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"
                          aria-label="Copy setup key"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">After enabling, a verified browser is remembered for 2 days. New devices must enter the authenticator code.</p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <Input value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code" inputMode="numeric" />
                    <Button type="button" onClick={confirmTwoFactor} disabled={twoFactorSaving || twoFactorCode.length !== 6}>
                      {twoFactorSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      Enable 2FA
                    </Button>
                  </div>
                </div>
              ) : null}

              {profileForm.twoFactorEnabled ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="text-sm font-semibold">Disable 2FA</div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Enter the current authenticator code to disable login protection.</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <Input value={disableTwoFactorCode} onChange={(event) => setDisableTwoFactorCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code" inputMode="numeric" />
                    <Button type="button" variant="secondary" onClick={disableTwoFactor} disabled={twoFactorSaving || disableTwoFactorCode.length !== 6}>
                      {twoFactorSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                      Disable
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end">
                <Button type="button" onClick={saveProfile} disabled={!token || profileSaving}>
                  {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary dark:bg-primary/15 dark:text-blue-300">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold">Password</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Password changes lock payouts for 24 hours.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold">
              Current password
              <PasswordInput
                value={passwordForm.currentPassword}
                onChange={(event) => updatePasswordField("currentPassword", event.target.value)}
                autoComplete="current-password"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              New password
              <PasswordInput value={passwordForm.newPassword} onChange={(event) => updatePasswordField("newPassword", event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Confirm password
              <PasswordInput value={passwordForm.confirmPassword} onChange={(event) => updatePasswordField("confirmPassword", event.target.value)} />
            </label>
            <Button type="button" variant="secondary" onClick={savePassword} disabled={!token || passwordSaving} className={cn("w-full", passwordSaving && "opacity-80")}>
              {passwordSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
              Update Password
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
