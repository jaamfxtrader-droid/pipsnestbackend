"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useState } from "react";
import { getStoredAuthToken, useAuthStore } from "@/store/auth-store";

type AuthAwareLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  authenticatedHref?: string;
  children: ReactNode;
};

export function AuthAwareLink({ href, authenticatedHref = "/dashboard", children, ...props }: AuthAwareLinkProps) {
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const hydrate = useAuthStore((state) => state.hydrate);
  const [hasStoredToken, setHasStoredToken] = useState(false);

  useEffect(() => {
    hydrate("user");
    setHasStoredToken(Boolean(getStoredAuthToken("user")));
  }, [hydrate]);

  return (
    <Link href={(scope === "user" && token) || hasStoredToken ? authenticatedHref : href} {...props}>
      {children}
    </Link>
  );
}
