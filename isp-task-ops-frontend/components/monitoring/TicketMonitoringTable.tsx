"use client";

import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";

export interface TicketMonitoringRow {
  ticketId: string;
  area: string;
  problemType: string;
  assignedTechnicians: string;
  requestedMaterials: string;
  progress: number;
  status: string;
}

function getStatusTone(status: string): "neutral" | "warning" | "danger" | "success" {
  if (status === "IN_PROGRESS") return "warning";
  if (status === "PENDING_MANAGER_REVIEW") return "danger";
  if (status === "COMPLETED" || status === "CLOSED") return "success";
  return "neutral";
}

export function TicketMonitoringTable({ rows }: { rows: TicketMonitoringRow[] }) {
  return (
    <Card title="Monitoring Tiket Aktif">
      <Table
        data={rows}
        emptyText="Belum ada tiket aktif."
        columns={[
          { header: "ID Tiket", key: "ticketId", render: (row) => <span className="font-semibold">{row.ticketId}</span> },
          { header: "Area", key: "area", render: (row) => row.area },
          { header: "Jenis Gangguan", key: "problemType", render: (row) => row.problemType },
          { header: "Teknisi Ditugaskan", key: "assignedTechnicians", render: (row) => row.assignedTechnicians },
          { header: "Material Diminta", key: "requestedMaterials", render: (row) => row.requestedMaterials },
          { header: "Progress", key: "progress", render: (row) => `${row.progress}%` },
          { header: "Status", key: "status", render: (row) => <Badge tone={getStatusTone(row.status)}>{row.status}</Badge> }
        ]}
      />
    </Card>
  );
}
