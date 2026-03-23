"use client";

import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";

interface LeaderTicketRow {
  ticketId: string;
  area: string;
  problemType: string;
  assignedTechnicians: string;
  progress: number;
  status: string;
}

function toneByStatus(status: string): "neutral" | "warning" | "danger" | "success" {
  if (status === "IN_PROGRESS") return "warning";
  if (status === "PENDING_MANAGER_REVIEW" || status === "ESCALATED") return "danger";
  if (status === "COMPLETED") return "success";
  return "neutral";
}

export function LeaderTicketTable({ rows }: { rows: LeaderTicketRow[] }) {
  return (
    <Card title="Tiket Tim Aktif">
      <Table
        data={rows}
        emptyText="Belum ada tiket aktif."
        columns={[
          { header: "ID Tiket", key: "ticketId", render: (row) => <span className="font-semibold">{row.ticketId}</span> },
          { header: "Area", key: "area", render: (row) => row.area },
          { header: "Jenis Gangguan", key: "problemType", render: (row) => row.problemType },
          { header: "Teknisi Ditugaskan", key: "assignedTechnicians", render: (row) => row.assignedTechnicians },
          { header: "Progress", key: "progress", render: (row) => `${row.progress}%` },
          { header: "Status", key: "status", render: (row) => <Badge tone={toneByStatus(row.status)}>{row.status}</Badge> }
        ]}
      />
    </Card>
  );
}
