"use client";

import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { useStockStore } from "@/store/useStockStore";

export default function StokGudangPage() {
  const items = useStockStore((state) => state.items);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Stok Gudang</h1>
      <Card title="Posisi Stok Material Gudang">
        <Table
          data={items}
          columns={[
            { header: "Material", key: "material", render: (row) => <span className="font-semibold">{row.name}</span> },
            { header: "Area", key: "area", render: (row) => row.branch },
            { header: "Qty", key: "qty", render: (row) => row.quantity },
            { header: "Satuan", key: "unit", render: (row) => row.unit }
          ]}
        />
      </Card>
    </div>
  );
}
