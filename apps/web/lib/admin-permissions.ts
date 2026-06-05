import { adminLinks } from "@/lib/mock-data";

export type AdminPermissionOption = {
  value: string;
  label: string;
  href: string;
};

export function permissionForAdminHref(href: string) {
  if (href === "/admin") return "admin:dashboard";
  return `admin:${href.replace("/admin/", "")}`;
}

export const adminPagePermissionOptions: AdminPermissionOption[] = adminLinks.map((link) => ({
  value: permissionForAdminHref(link.href),
  label: link.label,
  href: link.href
}));

export function canAccessAdminHref(
  user: { role?: string; permissions?: string[] } | undefined,
  href: string
) {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  const permissions = user.permissions ?? [];
  if (permissions.includes("admin:all")) return true;
  if (href === "/admin/settings") return false;
  if (href === "/admin/cms" && (permissions.includes("cms:all") || permissions.some((permission) => permission.startsWith("page:")))) return true;
  return permissions.includes(permissionForAdminHref(href));
}

export function firstAllowedAdminHref(user: { role?: string; permissions?: string[] } | undefined) {
  return adminLinks.find((link) => canAccessAdminHref(user, link.href))?.href;
}
