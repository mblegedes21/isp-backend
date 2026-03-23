"use client";

import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";

export interface TechnicianMonitoringRow {
  technicianName: string;
  currentTicket: string;
  workStatus: string;
  workDuration: string;
}

function getWorkTone(status: string): "neutral" | "warning" | "danger" | "success" {
  if (status === "Aktif Bekerja") return "warning";
  if (status === "Tidak Aktif") return "danger";
  if (status === "Siap Tugas") return "success";
  return "neutral";
}

export function TechnicianMonitoring({ rows }: { rows: TechnicianMonitoringRow[] }) {
  return (
    <Card title="Monitoring Aktivitas Teknisi">
      <Table
        data={rows}
        emptyText="Belum ada aktivitas teknisi."
        columns={[
          { header: "Nama Teknisi", key: "technicianName", render: (row) => <span className="font-semibold">{row.technicianName}</span> },
          { header: "Tiket Saat Ini", key: "currentTicket", render: (row) => row.currentTicket },
          { header: "Status Kerja", key: "workStatus", render: (row) => <Badge tone={getWorkTone(row.workStatus)}>{row.workStatus}</Badge> },
          { header: "Durasi Kerja", key: "workDuration", render: (row) => row.workDuration }
        ]}
      />
    </Card>
  );
}
