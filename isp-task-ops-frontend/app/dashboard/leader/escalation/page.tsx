"use client";

import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { useTicketStore } from "@/store/useTicketStore";
import { statusTiketLabel } from "@/lib/dashboard";

export default function LeaderEscalationPage() {
  const tickets = useTicketStore((state) => state.tickets);
  const escalatedTickets = tickets.filter((ticket) => ticket.escalated);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Eskalasi</h1>
      <Card title="Tiket Eskalasi Tim">
        <Table
          data={escalatedTickets}
          emptyText="Tidak ada eskalasi aktif."
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
