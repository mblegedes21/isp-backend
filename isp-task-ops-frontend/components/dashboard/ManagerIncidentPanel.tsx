"use client";

import { Bell, FileSearch, RadioTower, Siren } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { ManagementTable, type ManagementTableColumn } from "@/components/ui/ManagementTable";
import type { IncidentAlert } from "@/types/operations";

interface ManagerIncidentPanelProps {
  rows: IncidentAlert[];
  onAction: (incidentId: string, action: string) => void;
}

export function ManagerIncidentPanel({ rows, onAction }: ManagerIncidentPanelProps) {
  return (
    <Card title="Panel Insiden Area">
      <ManagementTable
        data={rows}
        rowKey={(row) => row.id}
        emptyText="Belum ada insiden terdeteksi."
        searchPlaceholder="Cari area, severity, atau status respons"
        searchableText={(row) => [row.areaName, row.severity, row.responseStatus].join(" ")}
        columns={[
          {
            key: "area",
            header: "Area / Severity",
            sortValue: (row) => row.areaName,
            render: (row) => (
              <div className="space-y-1">
                <p className="font-semibold text-gray-900">{row.areaName}</p>
                <p className="text-xs text-gray-500">{row.severity}</p>
              </div>
            )
          },
          {
            key: "impact",
            header: "Dampak",
            render: (row) => (
              <div className="space-y-1">
                <p className="font-medium text-gray-800">Tiket {row.ticketCount} | Eskalasi {row.escalationCount}</p>
                <p className="text-xs text-gray-500">{new Date(row.detectedAt).toLocaleString("id-ID")}</p>
              </div>
            )
          },
          {
            key: "response",
            header: "Respons",
            sortValue: (row) => row.responseStatus,
            render: (row) => (
              <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                {row.responseStatus}
              </span>
            )
          },
          {
            key: "actions",
            header: "Aksi",
            render: (row) => (
              <div className="flex flex-wrap justify-end gap-2">
                <IconActionButton icon={<Siren size={16} />} label="Deklarasikan Insiden" onClick={() => onAction(row.id, "Deklarasikan Insiden")} />
                <IconActionButton icon={<RadioTower size={16} />} label="Dispatch Tim Network" onClick={() => onAction(row.id, "Dispatch Tim Network")} />
                <IconActionButton icon={<Bell size={16} />} label="Notifikasi Semua Teknisi" onClick={() => onAction(row.id, "Notifikasi Semua Teknisi")} />
                <IconActionButton icon={<FileSearch size={16} />} label="Buka Investigasi" onClick={() => onAction(row.id, "Buka Investigasi")} />
              </div>
            ),
            cellClassName: "text-right"
          }
        ] satisfies ManagementTableColumn<IncidentAlert>[]}
      />
    </Card>
  );
}
