"use client";

import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { useTicketStore } from "@/store/useTicketStore";
import { statusTiketLabel } from "@/lib/dashboard";

export default function LeaderTiketTimPage() {
  const tickets = useTicketStore((state) => state.tickets);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tiket Tim</h1>
      <Card title="Daftar Tiket Tim">
        <Table
          data={tickets}
          columns={[
            { header: "Nomor Tiket", key: "id", render: (row) => <span className="font-semibold">{row.id}</span> },
            { header: "Lokasi", key: "lokasi", render: (row) => row.branch },
            { header: "Jenis Gangguan", key: "jenis", render: (row) => row.title },
            { header: "Status", key: "status", render: (row) => statusTiketLabel[row.status] ?? row.status }
          ]}
        />
      </Card>
    </div>
  );
}
