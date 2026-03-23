"use client";

import { RoleShell } from "@/components/layout/RoleShell";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell role="MANAGER">{children}</RoleShell>;
}
