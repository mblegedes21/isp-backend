"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ManagementTable, type ManagementTableColumn } from "@/components/ui/ManagementTable";

interface ManagerAreaStatusRow {
  areaId: string;
  areaName: string;
  status: "HIJAU" | "KUNING" | "MERAH";
  openTickets: number;
  escalatedTickets: number;
  slaCompliance: number;
}

interface ManagerAreaStatusProps {
  rows: ManagerAreaStatusRow[];
  onAction: (areaName: string, action: string) => void;
}

const statusMeta = {
  HIJAU: { label: "Normal", tone: "bg-green-100 text-green-800" },
  KUNING: { label: "Beban Tinggi", tone: "bg-amber-100 text-amber-800" },
  MERAH: { label: "Insiden", tone: "bg-red-100 text-red-800" }
};

export function ManagerAreaStatus({ rows, onAction }: ManagerAreaStatusProps) {
  return (
    <Card title="Monitoring Area">
      <ManagementTable
        data={rows}
        rowKey={(row) => row.areaId}
        emptyText="Belum ada data monitoring area."
        searchPlaceholder="Cari area atau status"
        searchableText={(row) => [row.areaName, row.status].join(" ")}
        columns={[
          {
            key: "area",
            header: "Area",
            sortValue: (row) => row.areaName,
            render: (row) => (
              <div className="space-y-1">
                <p className="font-semibold text-gray-900">{row.areaName}</p>
                <p className="text-xs text-gray-500">Open {row.openTickets} | Eskalasi {row.escalatedTickets}</p>
              </div>
            )
          },
          {
            key: "status",
            header: "Status",
            sortValue: (row) => row.status,
            render: (row) => (
              <div className="space-y-1">
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusMeta[row.status].tone}`}>
                  {statusMeta[row.status].label}
                </span>
                <p className="text-xs text-gray-500">SLA {row.slaCompliance}%</p>
              </div>
            )
          },
          {
            key: "actions",
            header: "Aksi",
            render: (row) => (
              row.status !== "HIJAU" ? (
                <div className="flex flex-wrap justify-end gap-2">
                  <Button className="px-3 py-2 text-sm" onClick={() => onAction(row.areaName, "Dispatch Tim Darurat")}>
                    Dispatch Tim Darurat
                  </Button>
                  <Button className="px-3 py-2 text-sm" onClick={() => onAction(row.areaName, "Eskalasi ke Tim Network")}>
                    Eskalasi ke Tim Network
                  </Button>
                  <Button variant="secondary" className="px-3 py-2 text-sm" onClick={() => onAction(row.areaName, "Kirim Notifikasi Area")}>
                    Kirim Notifikasi Area
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-gray-500">Tidak ada tindakan darurat</span>
              )
            ),
            cellClassName: "text-right"
          }
        ] satisfies ManagementTableColumn<ManagerAreaStatusRow>[]}
      />
    </Card>
  );
}
