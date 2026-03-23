"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Boxes,
  Circle,
  Clock,
  FileText,
  LayoutDashboard,
  Package,
  ShieldCheck,
  Ticket,
  Users,
  Warehouse
} from "lucide-react";
import type { NavItem } from "@/lib/navigation";

type IconType = typeof LayoutDashboard;

interface SidebarProps {
  role: string;
  menuItems: NavItem[];
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}

const resolveIcon = (item: NavItem): IconType => {
  const label = item.label.toLowerCase();
  const href = item.href.toLowerCase();

  if (href.endsWith("/dashboard") || label.includes("dashboard")) return LayoutDashboard;
  if (label.includes("ticket") || label.includes("tiket") || href.includes("ticket") || href.includes("tiket")) return Ticket;
  if (label.includes("absensi") || label.includes("attendance") || href.includes("absensi") || href.includes("attendance")) return Clock;
  if (label.includes("monitoring") || href.includes("monitoring")) return Activity;
  if (label.includes("material") || label.includes("stok") || label.includes("barang") || href.includes("material") || href.includes("stok")) return Package;
  if (label.includes("gudang") || label.includes("warehouse") || href.includes("warehouse") || href.includes("gudang")) return Warehouse;
  if (label.includes("area") || href.includes("area")) return BarChart3;
  if (label.includes("approval") || label.includes("audit") || label.includes("review") || href.includes("approval") || href.includes("audit")) return ShieldCheck;
  if (label.includes("tim") || label.includes("teknisi") || label.includes("users") || href.includes("users")) return Users;
  if (label.includes("riwayat") || label.includes("report") || href.includes("report") || href.includes("log")) return FileText;
  if (label.includes("master")) return Boxes;

  return Circle;
};

const isActiveItem = (pathname: string, href: string) => {
  const hrefDepth = href.split("/").filter(Boolean).length;
  if (hrefDepth <= 2) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export function Sidebar({ role, menuItems, collapsed, mobileOpen, onCloseMobile, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const roleLabel = `${String(role).toUpperCase()} PANEL`;

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity md:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onCloseMobile}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-primary/15 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900 text-white transition-all duration-300 md:z-20 md:w-[240px] ${collapsed ? "md:w-[72px]" : "md:w-[240px]"} ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex h-16 items-center border-b border-white/10 px-4">
          <p className={`hidden truncate text-[11px] font-bold uppercase tracking-[0.24em] text-blue-100/60 md:block ${collapsed ? "md:hidden" : "md:block"}`}>
            {roleLabel}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-100/60 md:hidden">{roleLabel}</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {menuItems.map((item) => {
            const active = isActiveItem(pathname, item.href);
            const Icon = resolveIcon(item);
            const isLogout = item.href === "__logout__";

            return (
              <div key={item.href} className="group relative">
                {isLogout ? (
                  <button
                    type="button"
                    onClick={() => {
                      onCloseMobile();
                      onLogout();
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${collapsed ? "md:justify-center md:px-0" : ""} bg-transparent text-blue-100/72 hover:bg-white/10 hover:text-white`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} className="shrink-0 text-blue-100/70" />
                    <span className={`truncate ${collapsed ? "md:hidden" : "md:inline"}`}>{item.label}</span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${collapsed ? "md:justify-center md:px-0" : ""} ${active ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-950/30" : "bg-transparent text-blue-100/72 hover:bg-white/10 hover:text-white"}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} className={`shrink-0 ${active ? "text-white" : "text-blue-100/70"}`} />
                    <span className={`truncate ${collapsed ? "md:hidden" : "md:inline"}`}>{item.label}</span>
                  </Link>
                )}

                {collapsed ? (
                  <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-xs text-white shadow-lg md:group-hover:block">
                    {item.label}
                  </span>
                ) : null}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
