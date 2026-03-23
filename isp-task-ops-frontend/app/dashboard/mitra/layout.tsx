"use client";

import { RoleShell } from "@/components/layout/RoleShell";

export default function MitraLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell role="MITRA">{children}</RoleShell>;
}
