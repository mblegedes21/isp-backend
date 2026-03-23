"use client";

import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";

export interface ProgressTicketRow {
  ticketId: string;
  technicians: string;
  progressPercentage: string;
  workDuration: string;
  photos: string;
  status: string;
}

function getTone(status: string): "neutral" | "warning" | "danger" | "success" {
  if (status === "IN_PROGRESS") return "warning";
  if (status === "PENDING_MANAGER_REVIEW") return "danger";
  if (status === "COMPLETED") return "success";
  return "neutral";
}

export function ProgressTicketTable({ rows }: { rows: ProgressTicketRow[] }) {
  return (
    <Card title="Daftar Tiket Sedang Dikerjakan">
      <Table
        data={rows}
        emptyText="Belum ada tiket yang sedang dikerjakan."
        columns={[
          { header: "ID Tiket", key: "ticketId", render: (row) => <span className="font-semibold">{row.ticketId}</span> },
          { header: "Teknisi", key: "technicians", render: (row) => row.technicians },
          { header: "Progress", key: "progressPercentage", render: (row) => row.progressPercentage },
          { header: "Durasi Kerja", key: "workDuration", render: (row) => row.workDuration },
          { header: "Foto", key: "photos", render: (row) => row.photos },
          { header: "Status", key: "status", render: (row) => <Badge tone={getTone(row.status)}>{row.status}</Badge> }
        ]}
      />
      <p className="mt-2 text-xs text-gray-600">
        Teknisi wajib unggah: Foto Sebelum, Foto Progress, dan Foto Selesai.
      </p>
    </Card>
  );
}
