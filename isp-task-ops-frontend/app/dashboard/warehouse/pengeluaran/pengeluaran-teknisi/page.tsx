"use client";

import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { useTicketStore } from "@/store/useTicketStore";

export default function PengeluaranTeknisiPage() {
  const tickets = useTicketStore((state) => state.tickets);
  const rows = tickets.map((ticket) => ({
    ticket: ticket.id,
    leader: "Leader Operasional",
    teknisi: ticket.assignee || "-",
    jenisPekerjaan: ticket.problemType,
    material: ticket.problemType === "FIBER_BACKBONE_DOWN" ? "Dropcore 1C" : "Fast Connector SC/APC",
    qty: ticket.problemType === "FIBER_BACKBONE_DOWN" ? 120 : 4
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pengeluaran Barang - Pengeluaran Teknisi</h1>
      <Card title="Request Pengeluaran Material Teknisi">
        <Table
          data={rows}
          columns={[
            { header: "Ticket", key: "ticket", render: (row) => row.ticket },
            { header: "Leader", key: "leader", render: (row) => row.leader },
            { header: "Teknisi", key: "teknisi", render: (row) => row.teknisi },
            { header: "Jenis Pekerjaan", key: "pekerjaan", render: (row) => row.jenisPekerjaan },
            { header: "Material", key: "material", render: (row) => row.material },
            { header: "Qty", key: "qty", render: (row) => row.qty },
            {
              header: "Aksi",
              key: "action",
              render: () => (
                <div className="flex gap-2">
                  <Button type="button">Submit Request</Button>
                  <Button type="button" variant="secondary">Print Laporan</Button>
                </div>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
}
