"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { roleDashboardPath } from "@/lib/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import type { Role } from "@/types/role";
import type { ReactNode } from "react";

interface RoleGuardProps {
  allowedRole: Role;
  children: ReactNode;
}

export function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated()) {
      router.replace("/auth/login");
      return;
    }

    if (user?.role !== allowedRole) {
      router.replace(user ? roleDashboardPath[user.role] : "/auth/login");
    }
  }, [allowedRole, hydrated, isAuthenticated, router, user]);

  if (!hydrated || !user || user.role !== allowedRole) {
    return <div className="p-6 text-sm text-gray-600">Memvalidasi akses...</div>;
  }

  return <>{children}</>;
}
