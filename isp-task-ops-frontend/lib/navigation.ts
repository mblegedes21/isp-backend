import type { Role } from "@/types/role";

export interface NavItem {
  label: string;
  href: string;
}

export const roleDashboardPath: Record<Role, string> = {
  NOC: "/dashboard/noc",
  TEKNISI: "/dashboard/technician",
  LEADER: "/dashboard/leader",
  MANAGER: "/dashboard/manager",
  ADMIN_GUDANG: "/dashboard/warehouse",
  MITRA: "/dashboard/mitra"
};

export const roleMenus: Record<Role, NavItem[]> = {
  NOC: [
    { label: "Dashboard", href: "/dashboard/noc" },
    { label: "Absensi", href: "/dashboard/noc/absensi" },
    { label: "Buat Ticket", href: "/dashboard/noc/buat-tiket" },
    { label: "Daftar Ticket", href: "/dashboard/noc/daftar-tiket" },
    { label: "Escalation", href: "/dashboard/noc/escalation" },
    { label: "Monitoring", href: "/dashboard/noc/monitoring" }
  ],
  TEKNISI: [
    { label: "Dashboard", href: "/dashboard/technician" },
    { label: "Ticket Saya", href: "/dashboard/technician/tickets" },
    { label: "Absensi", href: "/dashboard/technician/attendance" },
    { label: "Riwayat Pekerjaan", href: "/dashboard/technician/history" }
  ],
  LEADER: [
    { label: "Dashboard", href: "/dashboard/leader" },
    { label: "Manajemen Ticket", href: "/dashboard/leader/tickets" },
    { label: "Monitoring Tim", href: "/dashboard/leader/monitoring" },
    { label: "Absensi", href: "/dashboard/leader/attendance" }
  ],
  ADMIN_GUDANG: [
    { label: "Dashboard Gudang", href: "/dashboard/warehouse" },
    { label: "Master Material", href: "/dashboard/warehouse/master-material" },
    { label: "Purchase Request", href: "/dashboard/warehouse/purchase-request" },
    { label: "Penerimaan Barang", href: "/dashboard/warehouse/penerimaan-barang" },
    { label: "Pengeluaran Barang", href: "/dashboard/warehouse/pengeluaran-barang" },
    { label: "Loss Report", href: "/dashboard/warehouse/loss-report" },
    { label: "Riwayat Transaksi", href: "/dashboard/warehouse/riwayat-transaksi" },
    { label: "Audit Gudang", href: "/dashboard/warehouse/audit-gudang" }
  ],
  MITRA: [
    { label: "Dashboard", href: "/dashboard/mitra" },
    { label: "Tiket", href: "/dashboard/mitra/tickets" },
    { label: "Pelanggan Saya", href: "/dashboard/mitra/customers" },
    { label: "Profil", href: "/dashboard/mitra/profile" },
    { label: "Logout", href: "__logout__" }
  ],
  MANAGER: [
    { label: "Dashboard", href: "/dashboard/manager" },
    { label: "Mitra Monitoring", href: "/dashboard/manager/mitra" },
    { label: "Loss Report", href: "/dashboard/manager/loss-report" },
    { label: "Profil", href: "/dashboard/manager/profile" },
    { label: "Logout", href: "__logout__" }
  ]
};
