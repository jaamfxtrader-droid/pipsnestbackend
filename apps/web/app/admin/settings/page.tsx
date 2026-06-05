"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit3, ImageIcon, KeyRound, Plus, Save, ShieldCheck, Trash2, UserPlus, UserRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ClientDataTable as DataTable } from "@/components/ui/data-table-client";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PasswordInput } from "@/components/ui/password-input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { adminPagePermissionOptions } from "@/lib/admin-permissions";
import { cmsPageDrafts } from "@/lib/cms";
import { useTranslation } from "@/lib/use-translation";
import { getStoredAuthToken, isRememberedAuth, useAuthStore } from "@/store/auth-store";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  avatarUrl?: string | null;
  role: "TRADER" | "ADMIN" | "SUPER_ADMIN";
  isActive: boolean;
  permissions?: string[];
};

type RoleTemplate = {
  id: string;
  name: string;
  permissions: string[];
  locked?: boolean;
};

const emptyAdminForm = {
  name: "",
  username: "",
  email: "",
  avatarUrl: "",
  password: "",
  role: "ADMIN" as "ADMIN" | "SUPER_ADMIN",
  permissions: [] as string[]
};

function getAuthToken(token?: string) {
  if (token) return token;
  return getStoredAuthToken("admin");
}

function rememberCurrentSession() {
  return isRememberedAuth("admin");
}

function samePermissions(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((permission, index) => permission === sortedRight[index]);
}

function initialsFor(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function PermissionSwitch({
  label,
  checked,
  onClick
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onClick}
      className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-semibold transition ${
        checked
          ? "border-primary bg-primary/10 text-blue-700 dark:text-blue-300"
          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/40 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
      }`}
    >
      <span className="min-w-0 truncate">{label}</span>
      <span className={`ml-3 inline-flex h-6 w-10 shrink-0 items-center rounded-full p-1 transition ${checked ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"}`}>
        <span className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </span>
    </button>
  );
}

export default function SettingsPage() {
  const { tx } = useTranslation();
  const pushToast = useToast((state) => state.push);
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [deletingAdmin, setDeletingAdmin] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleteRoleTarget, setDeleteRoleTarget] = useState<RoleTemplate | null>(null);
  const [editForm, setEditForm] = useState(emptyAdminForm);
  const [profileForm, setProfileForm] = useState({
    name: "",
    username: "",
    email: "",
    avatarUrl: "",
    password: ""
  });
  const [roleTemplates, setRoleTemplates] = useState<RoleTemplate[]>([]);
  const [roleForm, setRoleForm] = useState({ name: "", permissions: [] as string[] });

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const permissionOptions = useMemo(
    () => [
      ...adminPagePermissionOptions.filter((page) => page.href !== "/admin/settings").map((page) => ({ value: page.value, label: `Admin: ${page.label}` })),
      { value: "cms:all", label: "CMS: All pages" },
      ...cmsPageDrafts.map((page) => ({ value: `page:${page.slug}`, label: `CMS page: ${page.slug}` }))
    ],
    []
  );

  useEffect(() => {
    if (!currentUser) return;
    setProfileForm({
      name: currentUser.name,
      username: currentUser.username ?? "",
      email: currentUser.email,
      avatarUrl: currentUser.avatarUrl ?? "",
      password: ""
    });
  }, [currentUser]);

  useEffect(() => {
    const authToken = getAuthToken(token);
    if (!isSuperAdmin || !authToken) return;

    setLoadingAdmins(true);
    apiFetch<{ users: AdminUser[] }>("/admin/admins", { token: authToken })
      .then((data) => setAdmins(data.users))
      .catch((error) =>
        pushToast({
          title: "Unable to load admins",
          message: error instanceof Error ? error.message : "Please try again.",
          tone: "error"
        })
      )
      .finally(() => setLoadingAdmins(false));
  }, [isSuperAdmin, pushToast, token]);

  useEffect(() => {
    const authToken = getAuthToken(token);
    if (!isSuperAdmin || !authToken) return;

    setLoadingRoles(true);
    apiFetch<{ roles: RoleTemplate[] }>("/admin/roles", { token: authToken })
      .then((data) => setRoleTemplates(data.roles))
      .catch((error) =>
        pushToast({
          title: "Unable to load roles",
          message: error instanceof Error ? error.message : "Please try again.",
          tone: "error"
        })
      )
      .finally(() => setLoadingRoles(false));
  }, [isSuperAdmin, pushToast, token]);

  function toggleEditPermission(permission: string) {
    setEditForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission]
    }));
  }

  function toggleRolePermission(permission: string) {
    setRoleForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission]
    }));
  }

  async function handleProfileAvatar(file?: File) {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setProfileForm((current) => ({ ...current, avatarUrl: dataUrl }));
  }

  async function handleEditAvatar(file?: File) {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setEditForm((current) => ({ ...current, avatarUrl: dataUrl }));
  }

  function assignedRoleLabel(permissions: string[] = []) {
    const match = roleTemplates.find((template) => samePermissions(template.permissions, permissions));
    if (match) return match.name;
    if (permissions.includes("cms:all")) return "CMS Manager";
    return permissions.length > 0 ? `${permissions.length} custom permissions` : "No assigned role";
  }

  async function saveProfile() {
    const authToken = getAuthToken(token);
    if (!authToken) return;

    setSavingProfile(true);
    try {
      const data = await apiFetch<{ user: AdminUser }>("/admin/profile", {
        method: "PUT",
        token: authToken,
        body: JSON.stringify({
          name: profileForm.name,
          username: profileForm.username,
          email: profileForm.email,
          avatarUrl: profileForm.avatarUrl,
          password: profileForm.password || undefined
        })
      });

      setAuth(authToken, data.user, { remember: rememberCurrentSession(), scope: "admin" });
      setAdmins((current) => current.map((admin) => (admin.id === data.user.id ? data.user : admin)));
      setProfileForm((current) => ({ ...current, password: "" }));
      pushToast({ title: "Profile updated", message: "Super admin profile settings were saved.", tone: "success" });
    } catch (error) {
      pushToast({
        title: "Profile update failed",
        message: error instanceof Error ? error.message : "Please check the profile fields.",
        tone: "error"
      });
    } finally {
      setSavingProfile(false);
    }
  }

  function openEditAdmin(admin: AdminUser) {
    setCreatingAdmin(false);
    setEditingAdmin(admin);
    setEditForm({
      name: admin.name,
      username: admin.username ?? "",
      email: admin.email,
      avatarUrl: admin.avatarUrl ?? "",
      password: "",
      role: admin.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN",
      permissions: admin.permissions ?? []
    });
  }

  function openCreateAdmin() {
    setEditingAdmin(null);
    setCreatingAdmin(true);
    setEditForm(emptyAdminForm);
  }

  useEffect(() => {
    if (!isSuperAdmin || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("createAdmin") !== "support") return;
    openCreateAdmin();
    params.delete("createAdmin");
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }, [isSuperAdmin]);

  async function saveAdmin() {
    const authToken = getAuthToken(token);
    if (!authToken || (!editingAdmin && !creatingAdmin)) return;

    setSavingAdmin(true);
    try {
      const data = await apiFetch<{ user: AdminUser }>(editingAdmin ? `/admin/users/${editingAdmin.id}` : "/admin/users", {
        method: editingAdmin ? "PUT" : "POST",
        token: authToken,
        body: JSON.stringify({
          name: editForm.name,
          username: editForm.username,
          email: editForm.email,
          avatarUrl: editForm.avatarUrl,
          password: editForm.password || undefined,
          role: editForm.role,
          permissions: editForm.role === "SUPER_ADMIN" ? ["admin:all", "cms:all"] : editForm.permissions
        })
      });

      setAdmins((current) => (editingAdmin ? current.map((admin) => (admin.id === data.user.id ? data.user : admin)) : [data.user, ...current]));
      if (data.user.id === currentUser?.id) setAuth(authToken, data.user, { remember: rememberCurrentSession(), scope: "admin" });
      setEditingAdmin(null);
      setCreatingAdmin(false);
      pushToast({
        title: editingAdmin ? "Admin updated" : "Admin created",
        message: `${data.user.username ?? data.user.email} ${editingAdmin ? "was updated" : "can now access assigned pages"}.`,
        tone: "success"
      });
    } catch (error) {
      pushToast({
        title: editingAdmin ? "Admin update failed" : "Admin create failed",
        message: error instanceof Error ? error.message : "Please check admin details.",
        tone: "error"
      });
    } finally {
      setSavingAdmin(false);
    }
  }

  async function deleteAdmin() {
    const authToken = getAuthToken(token);
    if (!authToken || !deleteTarget) return;

    setDeletingAdmin(true);
    try {
      await apiFetch<{ message: string }>(`/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
        token: authToken
      });
      setAdmins((current) => current.filter((admin) => admin.id !== deleteTarget.id));
      pushToast({ title: "Admin deleted", message: `${deleteTarget.username ?? deleteTarget.email} no longer has admin access.`, tone: "success" });
      setDeleteTarget(null);
    } catch (error) {
      pushToast({
        title: "Delete failed",
        message: error instanceof Error ? error.message : "This admin could not be deleted.",
        tone: "error"
      });
    } finally {
      setDeletingAdmin(false);
    }
  }

  async function createRoleTemplate() {
    const authToken = getAuthToken(token);
    if (!authToken) return;

    if (!roleForm.name.trim()) {
      pushToast({ title: "Role needs a name", message: "Add a role name, then attach pages now or later.", tone: "error" });
      return;
    }

    setSavingRole(true);
    try {
      const data = await apiFetch<{ role: RoleTemplate }>("/admin/roles", {
        method: "POST",
        token: authToken,
        body: JSON.stringify({
          name: roleForm.name.trim(),
          permissions: roleForm.permissions
        })
      });
      setRoleTemplates((current) => [...current, data.role]);
      setRoleForm({ name: "", permissions: [] });
      pushToast({ title: "Role saved", message: "New role template is ready for admin assignment.", tone: "success" });
    } catch (error) {
      pushToast({
        title: "Role save failed",
        message: error instanceof Error ? error.message : "This role could not be saved.",
        tone: "error"
      });
    } finally {
      setSavingRole(false);
    }
  }

  async function deleteRoleTemplate(role: RoleTemplate) {
    const authToken = getAuthToken(token);
    if (!authToken || role.locked) return;

    setSavingRole(true);
    try {
      await apiFetch<{ message: string }>(`/admin/roles/${role.id}`, {
        method: "DELETE",
        token: authToken
      });
      setRoleTemplates((current) => current.filter((template) => template.id !== role.id));
      setDeleteRoleTarget(null);
      pushToast({ title: "Role deleted", message: `${role.name} was removed from templates.`, tone: "success" });
    } catch (error) {
      pushToast({
        title: "Role delete failed",
        message: error instanceof Error ? error.message : "This role could not be deleted.",
        tone: "error"
      });
    } finally {
      setSavingRole(false);
    }
  }

  if (!isSuperAdmin) {
    return (
      <>
        <PageHeader title="Admin Settings" description="Super admin access is required for profile, roles, and admin management." />
        <div className="max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <h2 className="mt-4 text-xl font-semibold">Super admin only</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Ask a super admin to update admin profile settings or manage roles.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Admin Settings"
        description="Manage the super admin profile, admin roles, and assigned admin users."
        action={
          <Button type="button" onClick={openCreateAdmin}>
            <UserPlus className="h-4 w-4" />
            {tx("Add Admin")}
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary">
              <UserRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">{tx("Super admin profile")}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Update login identity, avatar, and password.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Full name
              <Input value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Username
              <Input value={profileForm.username} onChange={(event) => setProfileForm((current) => ({ ...current, username: event.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Email
              <Input type="email" value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Avatar image
              <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm transition hover:border-primary/40 dark:border-white/10 dark:bg-white/[0.04]">
                {profileForm.avatarUrl ? <img src={profileForm.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" /> : <ImageIcon className="h-5 w-5 text-slate-400" />}
                <span className="font-semibold text-slate-600 dark:text-slate-300">Upload avatar</span>
                <input type="file" accept="image/*" className="sr-only" onChange={(event) => handleProfileAvatar(event.target.files?.[0])} />
              </label>
            </label>
            <label className="grid gap-2 text-sm font-semibold md:col-span-2">
              New password
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <PasswordInput
                  className="pl-9"
                  value={profileForm.password}
                  onChange={(event) => setProfileForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Leave blank to keep current password"
                  autoComplete="new-password"
                />
              </div>
            </label>
          </div>

          <div className="mt-5 flex justify-end">
            <Button type="button" onClick={saveProfile} disabled={savingProfile}>
              <Save className="h-4 w-4" />
              {savingProfile ? tx("Saving") : tx("Save Profile")}
            </Button>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-profit/10 text-green-700 dark:text-green-300">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">{tx("Role templates")}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Save reusable assigned roles.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <Input placeholder={tx("Role name")} value={roleForm.name} onChange={(event) => setRoleForm((current) => ({ ...current, name: event.target.value }))} />
            <div className="scrollbar-hidden grid max-h-44 gap-2 overflow-y-auto pr-1">
              {permissionOptions.map((permission) => (
                <PermissionSwitch
                  key={permission.value}
                  label={permission.label}
                  checked={roleForm.permissions.includes(permission.value)}
                  onClick={() => toggleRolePermission(permission.value)}
                />
              ))}
            </div>
            <Button type="button" onClick={createRoleTemplate} disabled={savingRole}>
              <Plus className="h-4 w-4" />
              {savingRole ? tx("Saving") : tx("Save Role")}
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {loadingRoles ? <Badge tone="neutral">Loading roles</Badge> : null}
            {roleTemplates.map((template) => (
              <span
                key={template.id}
                className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-400/20"
              >
                {template.name}
                {!template.locked ? (
                  <button type="button" onClick={() => setDeleteRoleTarget(template)} className="rounded-sm p-0.5 text-slate-400 transition hover:bg-loss/10 hover:text-loss" aria-label={`Delete ${template.name}`}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                ) : null}
              </span>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{tx("Admin users")}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Edit or delete admins and review assigned roles.</p>
          </div>
          {loadingAdmins ? <Badge tone="neutral">{tx("Loading")}</Badge> : <Badge tone="primary">{admins.length} admins</Badge>}
        </div>

        <DataTable
          data={admins}
          loading={loadingAdmins}
          empty="No admin users found. Use Add Admin to create an RBAC admin and attach page access."
          columns={[
            {
              header: "Admin",
              cell: (row) => (
                <div className="flex items-center gap-3">
                  {row.avatarUrl ? (
                    <img src={row.avatarUrl} alt="" className="h-10 w-10 rounded-full bg-slate-200 object-cover dark:bg-slate-800" />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-950 text-xs font-black text-white dark:bg-white dark:text-slate-950">
                      {initialsFor(row.name) || "AD"}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-950 dark:text-white">
                      {row.name}
                      {row.id === currentUser?.id ? <span className="ml-2 text-xs text-primary">You</span> : null}
                    </span>
                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{row.email}</span>
                  </span>
                </div>
              )
            },
            { header: "Username", cell: (row) => row.username ?? "-" },
            { header: "Role", cell: (row) => <Badge tone={row.role === "SUPER_ADMIN" ? "profit" : "primary"}>{row.role}</Badge> },
            { header: "Assigned", cell: (row) => assignedRoleLabel(row.permissions) },
            { header: "Status", cell: (row) => <Badge tone={row.isActive ? "profit" : "loss"}>{row.isActive ? "active" : "disabled"}</Badge> },
            {
              header: "Actions",
              cell: (row) => (
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" className="h-8 rounded-md px-3" onClick={() => openEditAdmin(row)}>
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button type="button" variant="danger" className="h-8 rounded-md px-3" onClick={() => setDeleteTarget(row)} disabled={row.id === currentUser?.id}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              )
            }
          ]}
        />
      </section>

      <Modal
        open={Boolean(editingAdmin) || creatingAdmin}
        title={editingAdmin ? "Edit Admin" : "Create Admin"}
        onClose={() => {
          setEditingAdmin(null);
          setCreatingAdmin(false);
        }}
      >
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Name
              <Input value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Username
              <Input value={editForm.username} onChange={(event) => setEditForm((current) => ({ ...current, username: event.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Email
              <Input type="email" value={editForm.email} onChange={(event) => setEditForm((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Avatar image
              <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm transition hover:border-primary/40 dark:border-white/10 dark:bg-white/[0.04]">
                {editForm.avatarUrl ? <img src={editForm.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" /> : <ImageIcon className="h-5 w-5 text-slate-400" />}
                <span className="font-semibold text-slate-600 dark:text-slate-300">Upload avatar</span>
                <input type="file" accept="image/*" className="sr-only" onChange={(event) => handleEditAvatar(event.target.files?.[0])} />
              </label>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Role
              <Select
                value={editForm.role}
                onChange={(event) => setEditForm((current) => ({ ...current, role: event.target.value as "ADMIN" | "SUPER_ADMIN" }))}
              >
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              New password
              <PasswordInput
                value={editForm.password}
                onChange={(event) => setEditForm((current) => ({ ...current, password: event.target.value }))}
                placeholder={creatingAdmin ? "Set admin password" : "Leave blank"}
                autoComplete="new-password"
              />
            </label>
          </div>

          {editForm.role === "ADMIN" ? (
            <div className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
              <div className="mb-3 text-sm font-semibold">Apply role template</div>
              <div className="mb-4 flex flex-wrap gap-2">
                {roleTemplates
                  .filter((template) => !template.permissions.includes("admin:all"))
                  .map((template) => (
                    <Button
                      key={template.id}
                      type="button"
                      variant="secondary"
                      className="h-8 rounded-md px-3"
                      onClick={() => setEditForm((current) => ({ ...current, permissions: template.permissions }))}
                    >
                      {template.name}
                    </Button>
                  ))}
              </div>
              <div className="scrollbar-hidden grid max-h-52 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {permissionOptions.map((permission) => (
                  <PermissionSwitch
                    key={permission.value}
                    label={permission.label}
                    checked={editForm.permissions.includes(permission.value)}
                    onClick={() => toggleEditPermission(permission.value)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEditingAdmin(null);
                setCreatingAdmin(false);
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={saveAdmin} disabled={savingAdmin}>
              {savingAdmin ? tx("Saving") : editingAdmin ? tx("Save Admin") : tx("Create Admin")}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete admin?"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.username ?? deleteTarget.email}? This removes their admin login and assigned permissions.`
            : ""
        }
        confirmLabel={deletingAdmin ? "Deleting" : "Delete Admin"}
        loading={deletingAdmin}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteAdmin}
      />

      <ConfirmDialog
        open={Boolean(deleteRoleTarget)}
        title="Delete role template?"
        description={deleteRoleTarget ? `${deleteRoleTarget.name} will be removed from reusable admin role templates.` : ""}
        confirmLabel={savingRole ? "Deleting" : "Delete Role"}
        loading={savingRole}
        onClose={() => setDeleteRoleTarget(null)}
        onConfirm={() => {
          if (deleteRoleTarget) void deleteRoleTemplate(deleteRoleTarget);
        }}
      />
    </>
  );
}
