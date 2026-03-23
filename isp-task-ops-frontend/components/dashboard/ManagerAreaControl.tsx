"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ManagementTable, type ManagementTableColumn } from "@/components/ui/ManagementTable";
import type { AreaOperationalMetric } from "@/types/operations";

interface ManagerAreaControlProps {
  rows: Array<AreaOperationalMetric & { status: "HIJAU" | "KUNING" | "MERAH"; lastAction?: string }>;
  onAction: (areaName: string, action: string) => void;
}

const statusClass = {
  HIJAU: "bg-green-100 text-green-800",
  KUNING: "bg-amber-100 text-amber-800",
  MERAH: "bg-red-100 text-red-800"
};

const areaActions = [
  "Deploy Teknisi",
  "Reassign Leader",
  "Jadwalkan Inspeksi",
  "Buat Investigasi Infrastruktur",
  "Eskalasi ke Regional"
];

export function ManagerAreaControl({ rows, onAction }: ManagerAreaControlProps) {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  const selectedArea = useMemo(
    () => rows.find((row) => row.areaId === selectedAreaId) ?? null,
    [rows, selectedAreaId]
  );
  const columns: ManagementTableColumn<AreaOperationalMetric & { status: "HIJAU" | "KUNING" | "MERAH"; lastAction?: string }>[] = [
    {
      key: "area",
      header: "Area",
      sortValue: (row) => row.areaName,
      render: (row) => (
        <div className="space-y-1">
          <p className="font-semibold text-gray-900">{row.areaName}</p>
          <p className="text-xs text-gray-500">Aksi terakhir: {row.lastAction ?? "Belum ada aksi"}</p>
        </div>
      )
    },
    {
      key: "summary",
      header: "Ringkasan",
      render: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-gray-800">Open {row.openTickets} | Eskalasi {row.escalatedTickets}</p>
          <p className="text-xs text-gray-500">Teknisi aktif {row.activeTechnicians} | Repeat fault {row.repeatFaults}</p>
        </div>
      )
    },
    {
      key: "performance",
      header: "Performa",
      sortValue: (row) => row.slaCompliance,
      render: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-gray-800">SLA {row.slaCompliance}%</p>
          <p className="text-xs text-gray-500">Rata-rata perbaikan {row.averageRepairHours.toFixed(1)} jam</p>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => row.status,
      render: (row) => (
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusClass[row.status]}`}>
          {row.status}
        </span>
      )
    },
    {
      key: "actions",
      header: "Aksi",
      render: (row) => (
        <div className="flex justify-end">
          <Button variant="secondary" className="px-3 py-2 text-sm" onClick={() => setSelectedAreaId(row.areaId)}>
            Lihat Detail
          </Button>
        </div>
      ),
      cellClassName: "text-right"
    }
  ];

  return (
    <>
      <Card title="Kontrol Operasional Area">
        <ManagementTable
          data={rows}
          rowKey={(row) => row.areaId}
          emptyText="Belum ada data area operasional."
          searchPlaceholder="Cari area atau status"
          searchableText={(row) => [row.areaName, row.status, row.lastAction].filter(Boolean).join(" ")}
          columns={columns}
        />
      </Card>

      {selectedArea ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Detail Area</p>
                <h2 className="mt-1 text-xl font-bold">{selectedArea.areaName}</h2>
                <p className="text-sm text-gray-600">Aksi terakhir: {selectedArea.lastAction ?? "Belum ada aksi tercatat"}</p>
              </div>
              <Button variant="secondary" className="px-3 py-2 text-sm" onClick={() => setSelectedAreaId(null)}>
                Tutup
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-md bg-gray-50 p-3"><p className="text-xs text-gray-500">Open</p><p className="text-2xl font-bold">{selectedArea.openTickets}</p></div>
              <div className="rounded-md bg-gray-50 p-3"><p className="text-xs text-gray-500">Eskalasi</p><p className="text-2xl font-bold">{selectedArea.escalatedTickets}</p></div>
              <div className="rounded-md bg-gray-50 p-3"><p className="text-xs text-gray-500">SLA</p><p className="text-2xl font-bold">{selectedArea.slaCompliance}%</p></div>
              <div className="rounded-md bg-gray-50 p-3"><p className="text-xs text-gray-500">Repeat Fault</p><p className="text-2xl font-bold">{selectedArea.repeatFaults}</p></div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              {areaActions.map((action) => (
                <Button key={action} className="px-4 py-3 text-sm" onClick={() => onAction(selectedArea.areaName, action)}>
                  {action}
                </Button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
