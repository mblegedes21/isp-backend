"use client";

import { useState } from "react";
import { Ban, Search, ShieldAlert, ThumbsUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { useStockStore } from "@/store/useStockStore";

function statusTone(status: string): "neutral" | "warning" | "danger" | "success" {
  if (status === "DISETUJUI") return "success";
  if (status === "DITOLAK") return "danger";
  return "warning";
}

export default function WarehouseLossReportPage() {
  const losses = useStockStore((state) => state.losses);
  const approveLoss = useStockStore((state) => state.approveLoss);
  const rejectLoss = useStockStore((state) => state.rejectLoss);
  const startLossInvestigation = useStockStore((state) => state.startLossInvestigation);
  const [message, setMessage] = useState("");

  const onApprove = async (id: string) => {
    try {
      await approveLoss(id);
      setMessage("Loss report disetujui.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menyetujui loss report.");
    }
  };

  const onReject = async (id: string) => {
    try {
      await rejectLoss(id, "Tidak sesuai hasil verifikasi gudang.");
      setMessage("Loss report ditolak.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menolak loss report.");
    }
  };

  const onInvestigate = async (id: string) => {
    try {
      await startLossInvestigation(id);
      setMessage("Loss report masuk investigasi.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memperbarui loss report.");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Loss Report</h1>
      <Card title="Daftar Loss Report Material">
        <Table
          data={losses}
          emptyText="Belum ada loss report."
          columns={[
            { header: "Ticket", key: "ticket", render: (row) => row.ticketId },
            { header: "Teknisi", key: "teknisi", render: (row) => row.technicianName },
            { header: "Material", key: "material", render: (row) => row.materialName ?? row.itemId },
            { header: "Qty", key: "selisih", render: (row) => row.quantityLost },
            { header: "Unit Price", key: "unitPrice", render: (row) => `Rp ${(row.unitPrice ?? 0).toLocaleString("id-ID")}` },
            { header: "Total", key: "totalPrice", render: (row) => `Rp ${(row.totalPrice ?? 0).toLocaleString("id-ID")}` },
            { header: "Status", key: "status", render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge> },
            {
              header: "Actions",
              key: "actions",
              render: (row) => (
                <div className="flex gap-2">
                  <IconActionButton icon={<ThumbsUp className="h-4 w-4" />} label="Approve Loss Report" onClick={() => void onApprove(row.id)} disabled={row.status !== "MENUNGGU"} />
                  <IconActionButton icon={<ShieldAlert className="h-4 w-4" />} label="Investigate Loss Report" onClick={() => void onInvestigate(row.id)} disabled={row.status !== "MENUNGGU"} />
                  <IconActionButton icon={<Ban className="h-4 w-4" />} label="Reject Loss Report" tone="danger" onClick={() => void onReject(row.id)} disabled={row.status !== "MENUNGGU"} />
                  <IconActionButton icon={<Search className="h-4 w-4" />} label="View Loss Detail" onClick={() => setMessage(row.note)} />
                </div>
              )
            }
          ]}
        />
        {message ? <p className="mt-3 text-sm text-gray-700">{message}</p> : null}
      </Card>
    </div>
  );
}
