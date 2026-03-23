"use client";

import { RoleShell } from "@/components/layout/RoleShell";

export default function LeaderLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell role="LEADER">{children}</RoleShell>;
}
