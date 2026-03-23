"use client";

import type { PropsWithChildren } from "react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { roleMenus } from "@/lib/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLE_LABELS, type Role } from "@/types/role";
import { useRouter } from "next/navigation";

interface RoleShellProps {
  role: Role;
}

export function RoleShell({ role, children }: PropsWithChildren<RoleShellProps>) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const onLogout = () => {
    void logout().finally(() => {
      router.replace("/auth/login");
    });
  };

  return (
    <RoleGuard allowedRole={role}>
      <AppLayout role={ROLE_LABELS[role]} areaLabel="Area Pusat" menuItems={roleMenus[role] ?? roleMenus.MANAGER} onLogout={onLogout}>
        {children}
      </AppLayout>
    </RoleGuard>
  );
}
