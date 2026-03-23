"use client";

import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";

interface MaterialRow {
  ticket: string;
  material: string;
  requested: string;
  approved: string;
  used: string;
  remaining: string;
}

export function MaterialMonitor({ rows }: { rows: MaterialRow[] }) {
  return (
    <Card title="Monitoring Material">
      <Table
        data={rows}
        emptyText="Belum ada data material."
        columns={[
          { header: "Tiket", key: "ticket", render: (row) => <span className="font-semibold">{row.ticket}</span> },
          { header: "Material", key: "material", render: (row) => row.material },
          { header: "Diminta", key: "requested", render: (row) => row.requested },
          { header: "Disetujui", key: "approved", render: (row) => row.approved },
          { header: "Terpakai", key: "used", render: (row) => row.used },
          { header: "Sisa", key: "remaining", render: (row) => row.remaining }
        ]}
      />
    </Card>
  );
}
