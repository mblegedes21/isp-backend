"use client";

import { RoleShell } from "@/components/layout/RoleShell";

export default function NocLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell role="NOC">{children}</RoleShell>;
}
