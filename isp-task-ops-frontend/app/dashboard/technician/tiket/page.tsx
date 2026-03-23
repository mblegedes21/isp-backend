"use client";

import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { useTicketStore } from "@/store/useTicketStore";
import { statusTiketLabel } from "@/lib/dashboard";

export default function TechnicianTiketPage() {
  const tickets = useTicketStore((state) => state.tickets);
  const myTickets = tickets.filter((ticket) => ["Rizky", "Dina"].includes(ticket.assignee));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tiket Saya</h1>
      <Card title="Daftar Tiket Ditugaskan">
        <Table
          data={myTickets}
          columns={[
            { header: "Nomor Tiket", key: "id", render: (row) => <span className="font-semibold">{row.id}</span> },
            { header: "Jenis Pekerjaan", key: "jenis", render: (row) => row.title },
            { header: "Status", key: "status", render: (row) => statusTiketLabel[row.status] ?? row.status },
            { header: "Leader", key: "leader", render: () => "Leader Operasional" }
          ]}
        />
      </Card>
    </div>
  );
}
