"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { formatQuantityWithUnit } from "@/lib/material-display";
import { useStockStore } from "@/store/useStockStore";
import type { WarehouseTransaction, WarehouseTransactionTotals } from "@/types/stock";

function formatType(type: string) {
  return type.replaceAll("_", " ");
}

function typeTone(type: string): "neutral" | "warning" | "danger" | "success" {
  if (["antar_gudang_in", "pengembalian_teknisi", "pembelian_material"].includes(type)) return "success";
  if (type === "LOSS") return "danger";
  if (["antar_gudang_out", "pengeluaran_teknisi", "penjualan_material", "TRANSFER", "AUDIT_ADJUSTMENT"].includes(type)) return "warning";

  return "neutral";
}

export default function RiwayatTransaksiPage() {
  const fetchWarehouseHistory = useStockStore((state) => state.fetchWarehouseHistory);
  const [transactions, setTransactions] = useState<WarehouseTransaction[]>([]);
  const [totals, setTotals] = useState<WarehouseTransactionTotals>({ quantity: 0, value: 0 });
  const [message, setMessage] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const history = await fetchWarehouseHistory();
        setTransactions(history.rows);
        setTotals(history.totals);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Gagal memuat riwayat transaksi gudang.");
      }
    })();
  }, [fetchWarehouseHistory]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Riwayat Transaksi</h1>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card title="Total Quantity">
          <p className="text-2xl font-bold text-slate-900">{totals.quantity}</p>
        </Card>
        <Card title="Total Value">
          <p className="text-2xl font-bold text-slate-900">Rp {totals.value.toLocaleString("id-ID")}</p>
        </Card>
      </div>
      <Card title="Log Transaksi Material Gudang">
        <Table
          data={transactions}
          emptyText="Belum ada transaksi material."
          columns={[
            { header: "Tanggal", key: "tanggal", render: (row) => new Date(row.createdAt).toLocaleDateString("id-ID") },
            { header: "Material", key: "material", render: (row) => row.materialName ?? row.materialId },
            { header: "Type", key: "type", render: (row) => <Badge tone={typeTone(row.historyType ?? row.transactionType)}>{formatType(row.historyType ?? row.transactionType)}</Badge> },
            { header: "Technician", key: "technician", render: (row) => row.technicianName ?? "-" },
            { header: "Ticket", key: "ticket", render: (row) => row.ticketNumber ?? row.ticketId ?? "-" },
            { header: "Counterparty", key: "counterparty", render: (row) => row.sourceBranch ?? row.destinationBranch ?? row.supplier ?? row.customer ?? "-" },
            { header: "Qty", key: "qty", render: (row) => formatQuantityWithUnit(row.quantity, row.unit) },
            { header: "Unit Price", key: "unitPrice", render: (row) => `Rp ${row.unitPrice.toLocaleString("id-ID")}` },
            { header: "Total", key: "totalPrice", render: (row) => `Rp ${(row.totalValue ?? row.totalPrice).toLocaleString("id-ID")}` },
            { header: "Status", key: "status", render: (row) => row.status }
          ]}
        />
      </Card>
      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}
