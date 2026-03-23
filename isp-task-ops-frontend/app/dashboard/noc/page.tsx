"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiClient, buildActorHeaders, extractApiMessage } from "@/lib/api";
import { useTicketStore } from "@/store/useTicketStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useAuthStore } from "@/store/useAuthStore";
import { formatTanggal, statusTiketLabel } from "@/lib/dashboard";

export default function NocDashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const tickets = useTicketStore((state) => state.tickets);
  const fetchTickets = useTicketStore((state) => state.fetchTickets);
  const checkedIn = useAttendanceStore((state) => state.checkedIn);
  const checkedOut = useAttendanceStore((state) => state.checkedOut);
  const [stats, setStats] = useState({ total_tickets: 0, open_tickets: 0, resolved_tickets: 0, escalated_tickets: 0 });
  const [error, setError] = useState("");
  const statusAbsensi = checkedOut ? "Sudah Check Out" : checkedIn ? "Sudah Check In" : "Belum Check In";
  const statusTone = checkedOut ? "success" : checkedIn ? "warning" : "danger";

  useEffect(() => {
    if (!user) return;

    const loadDashboard = async () => {
      try {
        setError("");
        const [dashboardResponse] = await Promise.all([
          apiClient.get("/noc/dashboard", { headers: buildActorHeaders(user) }),
          fetchTickets(),
        ]);
        setStats(dashboardResponse.data.data ?? dashboardResponse.data);
      } catch (loadError) {
        setError(extractApiMessage(loadError, "Dashboard NOC gagal dimuat."));
      }
    };

    void loadDashboard();
  }, [fetchTickets, user]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard NOC</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Tickets" value={stats.total_tickets} />
        <StatCard title="Open Tickets" value={stats.open_tickets} />
        <StatCard title="Resolved Tickets" value={stats.resolved_tickets} />
        <StatCard title="Escalated Tickets" value={stats.escalated_tickets} />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Card title="Status Absensi Hari Ini">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge tone={statusTone}>{statusAbsensi}</Badge>
          <Button variant="secondary" onClick={() => router.push("/dashboard/noc/absensi")}>
            Buka Absensi
          </Button>
        </div>
      </Card>

      <Card title="Ringkasan Tiket">
        <Table
          data={tickets}
          columns={[
            { header: "Nomor Tiket", key: "id", render: (row) => <span className="font-semibold">{row.id}</span> },
            { header: "Lokasi", key: "lokasi", render: (row) => row.branch },
            { header: "Jenis Gangguan", key: "jenis", render: (row) => row.title },
            { header: "Status", key: "status", render: (row) => statusTiketLabel[row.status] ?? row.status },
            { header: "Leader", key: "leader", render: () => "Leader Operasional" },
            { header: "Tanggal", key: "tanggal", render: (row) => formatTanggal(row.createdAt) }
          ]}
        />
      </Card>
    </div>
  );
}
