"use client";

import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";

interface TechnicianRow {
  technicianName: string;
  currentTicket: string;
  workStatus: "Idle" | "Menuju Lokasi" | "Sedang Kerja" | "Selesai";
  workDuration: string;
}

function toneByWorkStatus(status: TechnicianRow["workStatus"]): "neutral" | "warning" | "danger" | "success" {
  if (status === "Sedang Kerja") return "warning";
  if (status === "Menuju Lokasi") return "neutral";
  if (status === "Selesai") return "success";
  return "danger";
}

export function TechnicianMonitor({ rows }: { rows: TechnicianRow[] }) {
  return (
    <Card title="Monitoring Teknisi">
      <Table
        data={rows}
        emptyText="Belum ada aktivitas teknisi."
        columns={[
          { header: "Nama Teknisi", key: "technicianName", render: (row) => <span className="font-semibold">{row.technicianName}</span> },
          { header: "Tiket Saat Ini", key: "currentTicket", render: (row) => row.currentTicket },
          { header: "Status Kerja", key: "workStatus", render: (row) => <Badge tone={toneByWorkStatus(row.workStatus)}>{row.workStatus}</Badge> },
          { header: "Durasi Kerja", key: "workDuration", render: (row) => row.workDuration }
        ]}
      />
    </Card>
  );
}
