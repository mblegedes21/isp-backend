"use client";

import { RoleShell } from "@/components/layout/RoleShell";

export default function WarehouseLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell role="ADMIN_GUDANG">{children}</RoleShell>;
}
