"use client";

import { RoleShell } from "@/components/layout/RoleShell";

export default function TechnicianLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell role="TEKNISI">{children}</RoleShell>;
}
