"use client";

import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";

export interface MaterialMonitoringRow {
  ticket: string;
  material: string;
  requestedQty: string;
  approvedQty: string;
  usedQty: string;
  remainingQty: string;
}

export function MaterialMonitoring({ rows }: { rows: MaterialMonitoringRow[] }) {
  return (
    <Card title="Monitoring Material">
      <Table
        data={rows}
        emptyText="Belum ada pemakaian material."
        columns={[
          { header: "Tiket", key: "ticket", render: (row) => <span className="font-semibold">{row.ticket}</span> },
          { header: "Material", key: "material", render: (row) => row.material },
          { header: "Qty Diminta", key: "requestedQty", render: (row) => row.requestedQty },
          { header: "Qty Disetujui", key: "approvedQty", render: (row) => row.approvedQty },
          { header: "Qty Terpakai", key: "usedQty", render: (row) => row.usedQty },
          { header: "Qty Sisa", key: "remainingQty", render: (row) => row.remainingQty }
        ]}
      />
    </Card>
  );
}
