"use client";

import { PanelLeftClose, PanelLeftOpen, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/useAuthStore";

interface HeaderProps {
  collapsed: boolean;
  roleLabel: string;
  areaLabel: string;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

export function Header({ collapsed, roleLabel, areaLabel, onToggleSidebar, onLogout }: HeaderProps) {
  const userName = useAuthStore((state) => state.user?.name);
  const safeUserName = typeof userName === "string" ? userName.trim() : "";
  const greeting = safeUserName ? `Semangat Kak ${safeUserName} 💪` : "Semangat Kak 💪";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-app-border bg-white/85 px-4 backdrop-blur-sm md:px-6">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-app-border bg-white text-app-text shadow-sm transition hover:bg-primary/5"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-bold text-primary">{greeting}</p>
          <p className="text-sm font-semibold text-app-text">Role: {roleLabel}</p>
          <p className="text-xs font-medium text-sky-800/70">Lokasi: {areaLabel}</p>
        </div>
        <Button variant="secondary" onClick={onLogout} className="inline-flex items-center gap-2">
          <LogOut size={16} />
          Logout
        </Button>
      </div>
    </header>
  );
}
