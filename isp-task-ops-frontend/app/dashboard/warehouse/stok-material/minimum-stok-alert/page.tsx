"use client";

import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { useStockStore } from "@/store/useStockStore";

export default function MinimumStokAlertPage() {
  const items = useStockStore((state) => state.items);
  const alerts = items.filter((item) => item.quantity <= item.minimum);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Minimum Stok Alert</h1>
      <Card title="Material Di Bawah Minimum Stock">
        <Table
          data={alerts}
          emptyText="Tidak ada material di bawah minimum stock."
          columns={[
            { header: "Nama Material", key: "name", render: (row) => row.name },
            { header: "SKU", key: "sku", render: (row) => row.sku },
            { header: "Qty", key: "qty", render: (row) => row.quantity },
            { header: "Minimum Stock", key: "minimum", render: (row) => row.minimum },
            { header: "Area", key: "area", render: (row) => row.branch }
          ]}
        />
      </Card>
    </div>
  );
}
