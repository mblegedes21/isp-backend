"use client";

import type { PropsWithChildren } from "react";
import { useState } from "react";
import type { NavItem } from "@/lib/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useSidebarStore } from "@/store/useSidebarStore";

interface AppLayoutProps {
  role: string;
  areaLabel: string;
  menuItems: NavItem[];
  onLogout: () => void;
}

export function AppLayout({ role, areaLabel, menuItems, onLogout, children }: PropsWithChildren<AppLayoutProps>) {
  const collapsed = useSidebarStore((state) => state.collapsed);
  const toggleSidebar = useSidebarStore((state) => state.toggleSidebar);
  const [mobileOpen, setMobileOpen] = useState(false);

  const onToggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileOpen((prev) => !prev);
      return;
    }

    toggleSidebar();
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text">
      <Sidebar
        role={role}
        menuItems={menuItems}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={onLogout}
      />

      <div className={`min-h-screen transition-[margin] duration-300 ${collapsed ? "md:ml-[72px]" : "md:ml-[240px]"}`}>
        <Header
          collapsed={collapsed}
          roleLabel={role}
          areaLabel={areaLabel}
          onToggleSidebar={onToggleSidebar}
          onLogout={onLogout}
        />

        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
