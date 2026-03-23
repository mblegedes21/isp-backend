"use client";

import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { useStockStore } from "@/store/useStockStore";

export default function WarehouseStokPage() {
  const items = useStockStore((state) => state.items);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Stok Barang</h1>
      <Card title="Data Stok Cabang">
        <Table
          data={items}
          columns={[
            { header: "Kode Barang", key: "kode", render: (row) => <span className="font-semibold">{row.sku}</span> },
            { header: "Nama Barang", key: "nama", render: (row) => row.name },
            { header: "Stok", key: "stok", render: (row) => row.quantity },
            { header: "Minimum Stok", key: "minimum", render: (row) => row.minimum },
            { header: "Cabang", key: "cabang", render: (row) => row.branch }
          ]}
        />
      </Card>
    </div>
  );
}
