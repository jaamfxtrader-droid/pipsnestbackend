import { adminLinks } from "@/lib/mock-data";

export type AdminPermissionOption = {
  value: string;
  label: string;
  href: string;
};

const adminPermissionChildren: Record<string, string[]> = {
  "admin:blogs": ["admin:blogs/new", "admin:blogs/edit"]
};

function rawPermissionForAdminHref(href: string) {
  if (href === "/admin") return "admin:dashboard";
  return `admin:${href.replace("/admin/", "")}`;
}

function routePermissionForAdminHref(href: string) {
  if (href === "/admin/blogs/new") return "admin:blogs/new";
  if (/^\/admin\/blogs\/[^/]+\/edit$/.test(href)) return "admin:blogs/edit";
  return rawPermissionForAdminHref(href);
}

function adminLinkForHref(href: string) {
  return [...adminLinks]
    .sort((first, second) => second.href.length - first.href.length)
    .find((link) => href === link.href || href.startsWith(`${link.href}/`));
}

export function permissionForAdminHref(href: string) {
  return rawPermissionForAdminHref(adminLinkForHref(href)?.href ?? href);
}

export const adminPagePermissionOptions: AdminPermissionOption[] = adminLinks.map((link) => ({
  value: permissionForAdminHref(link.href),
  label: link.label,
  href: link.href
}));

export function expandAdminPermissions(permissions: string[]) {
  return Array.from(
    new Set(permissions.flatMap((permission) => [permission, ...(adminPermissionChildren[permission] ?? [])]))
  );
}

export function toggleAdminPermission(permissions: string[], permission: string) {
  const relatedPermissions = [permission, ...(adminPermissionChildren[permission] ?? [])];
  if (permissions.includes(permission)) {
    return permissions.filter((item) => !relatedPermissions.includes(item));
  }
  return expandAdminPermissions([...permissions, permission]);
}

export function canAccessAdminHref(
  user: { role?: string; permissions?: string[] } | undefined,
  href: string
) {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  const permissions = user.permissions ?? [];
  if (permissions.includes("admin:all")) return true;
  const adminLink = adminLinkForHref(href);
  if (adminLink?.href === "/admin/settings") return false;
  if (adminLink?.href === "/admin/cms" && (permissions.includes("cms:all") || permissions.some((permission) => permission.startsWith("page:")))) return true;
  return permissions.includes(permissionForAdminHref(href)) || permissions.includes(routePermissionForAdminHref(href)) || permissions.includes(rawPermissionForAdminHref(href));
}

export function firstAllowedAdminHref(user: { role?: string; permissions?: string[] } | undefined) {
  return adminLinks.find((link) => canAccessAdminHref(user, link.href))?.href;
}
