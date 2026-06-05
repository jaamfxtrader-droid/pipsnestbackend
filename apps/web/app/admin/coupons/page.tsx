"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Percent, Plus, RefreshCw, Save, Trash2, TicketPercent } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SwitchField } from "@/components/ui/switch-field";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { currency } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

type CouponCategory = "CHALLENGE" | "TOPUP" | "ALL";
type DiscountType = "PERCENTAGE" | "FIXED";

type Coupon = {
  id: string;
  code: string;
  description?: string | null;
  category: CouponCategory;
  discountType: DiscountType;
  value: number | string;
  maxUses?: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const categoryLabels: Record<CouponCategory, string> = {
  CHALLENGE: "Challenge",
  TOPUP: "Top-up",
  ALL: "All"
};

function formatDiscount(coupon: Coupon) {
  const value = Number(coupon.value ?? 0);
  return coupon.discountType === "PERCENTAGE" ? `${value}%` : currency(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export default function CouponManagementPage() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const pushToast = useToast((state) => state.push);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState("");
  const [deleteCouponTarget, setDeleteCouponTarget] = useState<Coupon | null>(null);
  const [form, setForm] = useState({
    code: "",
    description: "",
    category: "CHALLENGE" as CouponCategory,
    discountType: "PERCENTAGE" as DiscountType,
    value: "",
    maxUses: "",
    isActive: true
  });

  useEffect(() => {
    hydrate("admin");
  }, [hydrate]);

  async function loadData(authToken = token) {
    if (!authToken) return;
    setLoading(true);
    try {
      const data = await apiFetch<{ coupons: Coupon[] }>("/admin/coupons", { token: authToken });
      setCoupons(data.coupons);
    } catch (error) {
      pushToast({
        title: "Coupons not loaded",
        message: error instanceof Error ? error.message : "Please refresh and try again.",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (scope !== "admin" || !token) return;
    loadData(token);
  }, [scope, token]);

  const activeCoupons = useMemo(() => coupons.filter((coupon) => coupon.isActive).length, [coupons]);
  const totalUses = useMemo(() => coupons.reduce((sum, coupon) => sum + coupon.usedCount, 0), [coupons]);

  function resetForm() {
    setEditingCouponId("");
    setForm({
      code: "",
      description: "",
      category: "CHALLENGE",
      discountType: "PERCENTAGE",
      value: "",
      maxUses: "",
      isActive: true
    });
  }

  function editCoupon(coupon: Coupon) {
    setEditingCouponId(coupon.id);
    setForm({
      code: coupon.code,
      description: coupon.description ?? "",
      category: coupon.category,
      discountType: coupon.discountType,
      value: String(coupon.value),
      maxUses: coupon.maxUses ? String(coupon.maxUses) : "",
      isActive: coupon.isActive
    });
  }

  async function saveCoupon() {
    if (!token) return;
    setSaving(true);
    try {
      const data = await apiFetch<{ coupon: Coupon }>(editingCouponId ? `/admin/coupons/${editingCouponId}` : "/admin/coupons", {
        method: editingCouponId ? "PUT" : "POST",
        token,
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          description: form.description.trim() || undefined,
          category: form.category,
          discountType: form.discountType,
          value: Number(form.value),
          maxUses: form.maxUses ? Number(form.maxUses) : undefined,
          isActive: form.isActive
        })
      });
      setCoupons((current) => (editingCouponId ? current.map((coupon) => (coupon.id === editingCouponId ? data.coupon : coupon)) : [data.coupon, ...current]));
      resetForm();
      pushToast({ title: editingCouponId ? "Coupon updated" : "Coupon created", message: `${data.coupon.code} is ready to use.`, tone: "success" });
    } catch (error) {
      pushToast({
        title: "Coupon not saved",
        message: error instanceof Error ? error.message : "Please check the coupon fields.",
        tone: "error"
      });
    } finally {
      setSaving(false);
    }
  }

  async function setCouponActive(coupon: Coupon, isActive: boolean) {
    if (!token) return;
    setSaving(true);
    try {
      const data = await apiFetch<{ coupon: Coupon }>(`/admin/coupons/${coupon.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({ isActive })
      });
      setCoupons((current) => current.map((item) => (item.id === coupon.id ? data.coupon : item)));
      pushToast({ title: isActive ? "Coupon activated" : "Coupon inactive", message: `${data.coupon.code} has been updated.`, tone: "success" });
    } catch (error) {
      pushToast({
        title: "Coupon status not updated",
        message: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteCoupon(coupon: Coupon) {
    if (!token) return;
    setSaving(true);
    try {
      const data = await apiFetch<{ coupon?: Coupon; message: string }>(`/admin/coupons/${coupon.id}`, {
        method: "DELETE",
        token
      });
      if (data.coupon) {
        setCoupons((current) => current.map((item) => (item.id === coupon.id ? data.coupon! : item)));
      } else {
        setCoupons((current) => current.filter((item) => item.id !== coupon.id));
      }
      if (editingCouponId === coupon.id) resetForm();
      setDeleteCouponTarget(null);
      pushToast({ title: "Coupon deleted", message: data.message, tone: "success" });
    } catch (error) {
      pushToast({
        title: "Coupon not deleted",
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
        title="Coupon Management"
        description="Create category-aware discounts for challenges, top-ups, or both."
        action={
          <Button type="button" variant="secondary" onClick={() => loadData()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-sm text-slate-500 dark:text-slate-400">Total coupons</div>
          <div className="mt-3 text-3xl font-black">{coupons.length}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-sm text-slate-500 dark:text-slate-400">Active coupons</div>
          <div className="mt-3 text-3xl font-black">{activeCoupons}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-sm text-slate-500 dark:text-slate-400">Total redemptions</div>
          <div className="mt-3 text-3xl font-black">{totalUses}</div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary dark:bg-primary/15 dark:text-blue-300">
              <TicketPercent className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold">{editingCouponId ? "Edit coupon" : "New coupon"}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Challenge purchases only accept Challenge or All coupons.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold">
              Coupon code
              <Input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="RANKUP25" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Description
              <Input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Launch discount" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                Category
                <Select
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as CouponCategory }))}
                >
                  <option value="CHALLENGE">Challenge</option>
                  <option value="TOPUP">Top-up</option>
                  <option value="ALL">All</option>
                </Select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Discount type
                <Select
                  value={form.discountType}
                  onChange={(event) => setForm((current) => ({ ...current, discountType: event.target.value as DiscountType }))}
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED">Fixed amount</option>
                </Select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                Value
                <Input value={form.value} onChange={(event) => setForm((current) => ({ ...current, value: event.target.value.replace(/[^\d.]/g, "") }))} placeholder="25" inputMode="decimal" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Max uses
                <Input value={form.maxUses} onChange={(event) => setForm((current) => ({ ...current, maxUses: event.target.value.replace(/[^\d]/g, "") }))} placeholder="Optional" inputMode="numeric" />
              </label>
            </div>
            <SwitchField
              checked={form.isActive}
              onChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))}
              label="Active coupon"
              description={form.isActive ? "Can be used by traders" : "Cannot be applied at checkout"}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Button type="button" onClick={saveCoupon} disabled={saving || !form.code || !form.value}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingCouponId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingCouponId ? "Update Coupon" : "Create Coupon"}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Reset
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="border-b border-slate-200 p-5 dark:border-white/10">
            <h2 className="font-semibold">Coupon ledger</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">All coupon records come from the database.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-white/[0.04] dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Code</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Discount</th>
                  <th className="px-5 py-3 font-semibold">Usage</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {loading ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500">Loading coupons...</td></tr>
                ) : coupons.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500">No coupons created yet.</td></tr>
                ) : (
                  coupons.map((coupon) => (
                    <tr key={coupon.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.04]">
                      <td className="px-5 py-4">
                        <div className="font-semibold">{coupon.code}</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{coupon.description || "No description"}</div>
                      </td>
                      <td className="px-5 py-4"><Badge tone={coupon.category === "ALL" ? "primary" : "neutral"}>{categoryLabels[coupon.category]}</Badge></td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 font-semibold">
                          <Percent className="h-4 w-4 text-primary" />
                          {formatDiscount(coupon)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{coupon.usedCount} / {coupon.maxUses ?? "Unlimited"}</td>
                      <td className="px-5 py-4"><Badge tone={coupon.isActive ? "profit" : "neutral"}>{coupon.isActive ? "Active" : "Inactive"}</Badge></td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatDate(coupon.createdAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="secondary" className="h-8 px-3 text-xs" onClick={() => editCoupon(coupon)}>
                            Edit
                          </Button>
                          <Button type="button" variant="secondary" className="h-8 px-3 text-xs" onClick={() => setCouponActive(coupon, !coupon.isActive)} disabled={saving}>
                            {coupon.isActive ? "Inactivate" : "Activate"}
                          </Button>
                          <Button type="button" variant="danger" className="h-8 px-3 text-xs" onClick={() => setDeleteCouponTarget(coupon)} disabled={saving}>
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(deleteCouponTarget)}
        title="Delete coupon?"
        description={
          deleteCouponTarget
            ? `${deleteCouponTarget.code} will be deleted if it has no usage history. If traders have already used it, it will be marked inactive instead.`
            : ""
        }
        confirmLabel="Delete Coupon"
        loading={saving}
        onClose={() => setDeleteCouponTarget(null)}
        onConfirm={() => {
          if (deleteCouponTarget) void deleteCoupon(deleteCouponTarget);
        }}
      />
    </>
  );
}
