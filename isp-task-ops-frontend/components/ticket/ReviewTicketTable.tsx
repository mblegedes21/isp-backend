"use client";

import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";

export interface ReviewTicketRow {
  ticketId: string;
  technicians: string;
  materialUsed: string;
  materialRemaining: string;
  photos: string;
}

export function ReviewTicketTable({ rows }: { rows: ReviewTicketRow[] }) {
  return (
    <Card title="Tiket Menunggu Review Leader">
      <Table
        data={rows}
        emptyText="Belum ada tiket menunggu review."
        columns={[
          { header: "ID Tiket", key: "ticketId", render: (row) => <span className="font-semibold">{row.ticketId}</span> },
          { header: "Teknisi", key: "technicians", render: (row) => row.technicians },
          { header: "Material Terpakai", key: "materialUsed", render: (row) => row.materialUsed },
          { header: "Sisa Material", key: "materialRemaining", render: (row) => row.materialRemaining },
          { header: "Foto", key: "photos", render: (row) => row.photos },
          {
            header: "Aksi",
            key: "action",
            render: () => (
              <Button type="button" variant="secondary">
                Laporkan Sisa ke Gudang
              </Button>
            )
          }
        ]}
      />
    </Card>
  );
}
