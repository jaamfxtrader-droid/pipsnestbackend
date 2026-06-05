"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Ban, CheckCircle2, ChevronDown, Clock3, RefreshCw, Settings, ShieldOff, UserCheck, UserRoundCheck, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientDataTable as DataTable } from "@/components/ui/data-table-client";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { getStoredAuthToken, useAuthStore } from "@/store/auth-store";

type UserStatusMode = "ACTIVE" | "TEMPORARILY_BLOCKED" | "PERMANENTLY_BLOCKED";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  phone?: string | null;
  role: "TRADER" | "ADMIN" | "SUPER_ADMIN";
  status?: "PENDING" | "APPROVED";
  emailVerified?: boolean;
  isActive: boolean;
  blockedAt?: string | null;
  blockedUntil?: string | null;
  blockReason?: string | null;
  permissions?: string[];
};

type AdminUserStats = {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  blockedUsers: number;
};

function getAuthToken(token?: string) {
  if (token) return token;
  return getStoredAuthToken("admin");
}

function getUserStatus(user: AdminUser): UserStatusMode | "EXPIRED_BLOCK" {
  if (user.isActive) return "ACTIVE";
  if (!user.blockedUntil) return "PERMANENTLY_BLOCKED";
  return new Date(user.blockedUntil) > new Date() ? "TEMPORARILY_BLOCKED" : "EXPIRED_BLOCK";
}

function statusCopy(status: ReturnType<typeof getUserStatus>) {
  if (status === "ACTIVE") return { label: "Active", tone: "profit" as const, Icon: CheckCircle2 };
  if (status === "TEMPORARILY_BLOCKED") return { label: "Temp blocked", tone: "warning" as const, Icon: Clock3 };
  if (status === "EXPIRED_BLOCK") return { label: "Block expired", tone: "warning" as const, Icon: ShieldOff };
  return { label: "Blocked", tone: "loss" as const, Icon: Ban };
}

const statusOptions: Array<{
  value: UserStatusMode;
  label: string;
  description: string;
  Icon: typeof CheckCircle2;
  accent: string;
}> = [
  {
    value: "ACTIVE",
    label: "Active",
    description: "Trader can access the account and request payouts.",
    Icon: CheckCircle2,
    accent: "text-green-600 bg-green-500/10 ring-green-500/20 dark:text-green-300 dark:bg-green-500/15"
  },
  {
    value: "TEMPORARILY_BLOCKED",
    label: "Temporary block",
    description: "Payouts and account access stay blocked until the selected time.",
    Icon: Clock3,
    accent: "text-amber-600 bg-amber-500/10 ring-amber-500/20 dark:text-amber-300 dark:bg-amber-500/15"
  },
  {
    value: "PERMANENTLY_BLOCKED",
    label: "Permanent block",
    description: "Payouts and account access stay blocked until an admin reactivates the trader.",
    Icon: Ban,
    accent: "text-red-600 bg-red-500/10 ring-red-500/20 dark:text-red-300 dark:bg-red-500/15"
  }
];

function toDateTimeLocal(value: Date) {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function computeUserStats(users: AdminUser[]): AdminUserStats {
  const pendingUsers = users.filter((user) => user.status === "PENDING" || !user.emailVerified).length;
  const approvedUsers = users.filter((user) => user.status === "APPROVED" || user.emailVerified).length;
  return {
    totalUsers: users.length,
    pendingUsers,
    approvedUsers,
    blockedUsers: users.filter((user) => !user.isActive).length
  };
}

export default function UserManagementPage() {
  const pushToast = useToast((state) => state.push);
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminUserStats>({ totalUsers: 0, pendingUsers: 0, approvedUsers: 0, blockedUsers: 0 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [statusMode, setStatusMode] = useState<UserStatusMode>("ACTIVE");
  const [statusSelectorOpen, setStatusSelectorOpen] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const statusSelectorRef = useRef<HTMLDivElement>(null);
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const canManageTraders = Boolean(getAuthToken(token));
  const selectedStatusOption = statusOptions.find((option) => option.value === statusMode) ?? statusOptions[0];
  const SelectedStatusIcon = selectedStatusOption.Icon;

  const loadUsers = useCallback(() => {
    const authToken = getAuthToken(token);
    if (!authToken) return;

    setLoading(true);
    apiFetch<{ users: AdminUser[]; stats?: AdminUserStats }>("/admin/users", { token: authToken })
      .then((data) => {
        setUsers(data.users);
        setStats(
          data.stats ?? computeUserStats(data.users)
        );
      })
      .catch((error) =>
        pushToast({
          title: "Unable to load users",
          message: error instanceof Error ? error.message : "Please try again.",
          tone: "error"
        })
      )
      .finally(() => setLoading(false));
  }, [pushToast, token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!statusSelectorOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!statusSelectorRef.current?.contains(event.target as Node)) {
        setStatusSelectorOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [statusSelectorOpen]);

  function openStatusModal(user: AdminUser) {
    const status = getUserStatus(user);
    setSelectedUser(user);
    setStatusMode(status === "EXPIRED_BLOCK" ? "ACTIVE" : status);
    setStatusSelectorOpen(false);
    setBlockedUntil(user.blockedUntil ? toDateTimeLocal(new Date(user.blockedUntil)) : toDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000)));
    setBlockReason(user.blockReason ?? "");
  }

  async function saveStatus() {
    if (!selectedUser) return;
    const authToken = getAuthToken(token);
    if (!authToken) return;

    const payload = {
      status: statusMode,
      blockedUntil: statusMode === "TEMPORARILY_BLOCKED" ? new Date(blockedUntil).toISOString() : null,
      blockReason: statusMode === "ACTIVE" ? null : blockReason
    };

    if (statusMode !== "ACTIVE" && !blockReason.trim()) {
      pushToast({
        title: "Reason required",
        message: "Add an admin reason before blocking this trader.",
        tone: "error"
      });
      return;
    }

    setSaving(true);
    try {
      const data = await apiFetch<{ user: AdminUser }>(`/admin/users/${selectedUser.id}/status`, {
        method: "PATCH",
        token: authToken,
        body: JSON.stringify(payload)
      });
      setUsers((current) => {
        const nextUsers = current.map((user) => (user.id === data.user.id ? data.user : user));
        setStats(computeUserStats(nextUsers));
        return nextUsers;
      });
      setSelectedUser(null);
      setStatusSelectorOpen(false);
      pushToast({
        title: "User status updated",
        message: `${data.user.name} is now ${statusCopy(getUserStatus(data.user)).label.toLowerCase()}.`,
        tone: "success"
      });
    } catch (error) {
      pushToast({
        title: "Unable to update status",
        message: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Trader Management"
        description="Live trader records, verification, access status, and payout blocking controls."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" onClick={loadUsers} disabled={loading}>
              <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh
            </Button>
            {isSuperAdmin ? (
              <Link
                href="/admin/settings"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
              >
                <Settings className="h-4 w-4" />
                Admin Settings
              </Link>
            ) : null}
          </div>
        }
      />
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        {[
          { label: "Total Traders", value: stats.totalUsers, Icon: UsersRound, tone: "primary" as const },
          { label: "Approved", value: stats.approvedUsers, Icon: UserRoundCheck, tone: "profit" as const },
          { label: "Pending / Blocked", value: `${stats.pendingUsers} / ${stats.blockedUsers}`, Icon: UserCheck, tone: "warning" as const }
        ].map((item) => {
          const Icon = item.Icon;

          return (
            <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{item.label}</span>
                <Badge tone={item.tone} className="h-9 w-9 justify-center p-0">
                  <Icon className="h-4 w-4" />
                </Badge>
              </div>
              <div className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">{item.value}</div>
            </div>
          );
        })}
      </div>
      <DataTable
        data={users}
        loading={loading}
        pageSize={10}
        empty="No trader users found yet. New traders will appear here after account creation."
        columns={[
          {
            header: "User",
            cell: (row) => (
              <span className="grid gap-1">
                <span className="font-semibold text-slate-950 dark:text-white">{row.name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">@{row.username ?? "no-username"}</span>
              </span>
            )
          },
          { header: "Email", cell: (row) => row.email },
          { header: "Phone", cell: (row) => row.phone ?? "-" },
          {
            header: "Status",
            cell: (row) => {
              const copy = statusCopy(getUserStatus(row));
              const Icon = copy.Icon;

              return (
                <span className="grid gap-1">
                  <Badge tone={copy.tone} className="w-fit gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    {copy.label}
                  </Badge>
                  {!row.isActive && row.blockedUntil ? <span className="text-xs text-slate-500 dark:text-slate-400">Until {formatDateTime(row.blockedUntil)}</span> : null}
                </span>
              );
            }
          },
          {
            header: "Payout Access",
            cell: (row) => <Badge tone={row.isActive ? "profit" : "loss"}>{row.isActive ? "Allowed" : "Blocked"}</Badge>
          },
          {
            header: "Verification",
            cell: (row) => (
              <Badge tone={row.emailVerified || row.status === "APPROVED" ? "profit" : "warning"}>
                {row.emailVerified || row.status === "APPROVED" ? "Approved" : "Pending"}
              </Badge>
            )
          },
          {
            header: "Action",
            cell: (row) => {
              const disabled = !canManageTraders || row.role !== "TRADER";

              return (
                <Button type="button" variant="secondary" className="h-8 rounded-md px-3" disabled={disabled} onClick={() => openStatusModal(row)}>
                  Manage
                </Button>
              );
            }
          }
        ]}
      />

      <Modal open={Boolean(selectedUser)} title="Update User Status" onClose={() => {
        setSelectedUser(null);
        setStatusSelectorOpen(false);
      }}>
        <div className="grid gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-950 dark:text-white">{selectedUser?.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{selectedUser?.email}</p>
          </div>

          <div className="grid gap-2 text-sm font-semibold">
            <span>Status</span>
            <div ref={statusSelectorRef} className="relative">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={statusSelectorOpen}
                onClick={() => setStatusSelectorOpen((current) => !current)}
                className="flex min-h-[4.75rem] w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left shadow-sm outline-none transition hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-white/[0.06] dark:hover:border-primary/45"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-md ring-1", selectedStatusOption.accent)}>
                    <SelectedStatusIcon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-950 dark:text-white">{selectedStatusOption.label}</span>
                    <span className="mt-1 block text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">{selectedStatusOption.description}</span>
                  </span>
                </span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition", statusSelectorOpen && "rotate-180 text-primary")} />
              </button>

              {statusSelectorOpen ? (
                <div
                  role="listbox"
                  className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-[0_22px_60px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-[#0b172d]"
                >
                  {statusOptions.map((option) => {
                    const Icon = option.Icon;
                    const selected = option.value === statusMode;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          setStatusMode(option.value);
                          setStatusSelectorOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition",
                          selected
                            ? "bg-primary/10 text-primary dark:bg-primary/15 dark:text-blue-300"
                            : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                        )}
                      >
                        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-md ring-1", option.accent)}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">{option.label}</span>
                          <span className={cn("mt-1 block text-xs font-medium leading-5", selected ? "text-primary/80 dark:text-blue-200" : "text-slate-500 dark:text-slate-400")}>
                            {option.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          {statusMode === "TEMPORARILY_BLOCKED" ? (
            <label className="grid gap-2 text-sm font-semibold">
              Block until
              <input
                type="datetime-local"
                value={blockedUntil}
                onChange={(event) => setBlockedUntil(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-white/5"
              />
            </label>
          ) : null}

          {statusMode !== "ACTIVE" ? (
            <label className="grid gap-2 text-sm font-semibold">
              Reason
              <textarea
                value={blockReason}
                onChange={(event) => setBlockReason(event.target.value)}
                rows={3}
                className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-white/5"
                placeholder="Required admin reason. This will be sent to the trader by email."
              />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Blocked traders cannot create payout requests while the restriction is active.</span>
            </label>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => {
              setSelectedUser(null);
              setStatusSelectorOpen(false);
            }}>
              Cancel
            </Button>
            <Button type="button" variant={statusMode === "ACTIVE" ? "primary" : "danger"} onClick={saveStatus} disabled={saving || (statusMode !== "ACTIVE" && !blockReason.trim())}>
              {saving ? "Saving" : statusMode === "ACTIVE" ? "Activate" : "Block user"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
