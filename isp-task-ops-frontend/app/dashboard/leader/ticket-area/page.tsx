"use client";

import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { useTicketStore } from "@/store/useTicketStore";
import { statusTiketLabel } from "@/lib/dashboard";

export default function LeaderTicketAreaPage() {
  const tickets = useTicketStore((state) => state.tickets);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Ticket Area</h1>
      <Card title="Daftar Ticket per Area">
        <Table
          data={tickets}
          columns={[
            { header: "Nomor Ticket", key: "id", render: (row) => <span className="font-semibold">{row.id}</span> },
            { header: "Area", key: "area", render: (row) => row.branch },
            { header: "Gangguan", key: "title", render: (row) => row.title },
            { header: "Status", key: "status", render: (row) => statusTiketLabel[row.status] ?? row.status },
          ]}
        />
      </Card>
    </div>
  );
}
