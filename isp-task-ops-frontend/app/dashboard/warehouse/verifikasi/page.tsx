"use client";

import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { useStockStore } from "@/store/useStockStore";

export default function WarehouseVerifikasiPage() {
  const transfers = useStockStore((state) => state.transfers);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Verifikasi Pengembalian</h1>
      <Card title="Daftar Pengembalian/Transfer">
        <Table
          data={transfers}
          columns={[
            { header: "ID Transfer", key: "id", render: (row) => <span className="font-semibold">{row.id}</span> },
            { header: "Dari Cabang", key: "dari", render: (row) => row.fromBranch },
            { header: "Ke Cabang", key: "ke", render: (row) => row.toBranch },
            { header: "Jumlah", key: "jumlah", render: (row) => row.quantity },
            { header: "Status", key: "status", render: (row) => (row.status === "APPROVED" ? "Terverifikasi" : "Menunggu Verifikasi") }
          ]}
        />
      </Card>
    </div>
  );
}
