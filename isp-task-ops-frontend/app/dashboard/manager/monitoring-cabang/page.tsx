"use client";

import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { useTicketStore } from "@/store/useTicketStore";

export default function ManagerMonitoringCabangPage() {
  const tickets = useTicketStore((state) => state.tickets);
  const cabangData = Object.values(
    tickets.reduce<Record<string, { cabang: string; tiketAktif: number; eskalasi: number }>>((acc, ticket) => {
      if (!acc[ticket.branch]) {
        acc[ticket.branch] = { cabang: ticket.branch, tiketAktif: 0, eskalasi: 0 };
      }

      if (!["CLOSED", "CLOSED_WITH_LOSS"].includes(ticket.status)) {
        acc[ticket.branch].tiketAktif += 1;
      }

      if (ticket.escalated) {
        acc[ticket.branch].eskalasi += 1;
      }

      return acc;
    }, {})
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Monitoring Cabang</h1>
      <Card title="Performa Operasional per Cabang">
        <Table
          data={cabangData}
          columns={[
            { header: "Cabang", key: "cabang", render: (row) => <span className="font-semibold">{row.cabang}</span> },
            { header: "Tiket Aktif", key: "aktif", render: (row) => row.tiketAktif },
            { header: "Tiket Eskalasi", key: "eskalasi", render: (row) => row.eskalasi },
            { header: "Status", key: "status", render: (row) => (row.eskalasi > 0 ? "Perlu Perhatian" : "Stabil") }
          ]}
        />
      </Card>
    </div>
  );
}
