"use client";

import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { useTicketStore } from "@/store/useTicketStore";

export default function PengembalianTeknisiPage() {
  const tickets = useTicketStore((state) => state.tickets);
  const rows = tickets.map((ticket) => ({
    ticket: ticket.id,
    leader: "Leader Operasional",
    teknisi: ticket.assignee || "-",
    material: ticket.problemType === "FIBER_BACKBONE_DOWN" ? "Dropcore 1C" : "Fast Connector SC/APC",
    qty: ticket.problemType === "FIBER_BACKBONE_DOWN" ? 20 : 2
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Penerimaan Barang - Pengembalian Teknisi</h1>
      <Card title="Verifikasi Pengembalian Material Teknisi">
        <Table
          data={rows}
          columns={[
            { header: "Ticket", key: "ticket", render: (row) => row.ticket },
            { header: "Leader", key: "leader", render: (row) => row.leader },
            { header: "Teknisi", key: "teknisi", render: (row) => row.teknisi },
            { header: "Material", key: "material", render: (row) => row.material },
            { header: "Qty", key: "qty", render: (row) => row.qty },
            {
              header: "Aksi",
              key: "action",
              render: () => (
                <div className="flex gap-2">
                  <Button type="button" variant="secondary">Sesuai - Tutup Ticket</Button>
                  <Button type="button" variant="danger">Tidak Sesuai - Buat Loss Report</Button>
                </div>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
}
