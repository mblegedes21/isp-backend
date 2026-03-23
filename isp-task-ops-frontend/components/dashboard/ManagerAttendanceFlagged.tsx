"use client";

import { Bell, Check, FileText, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { ManagementTable, type ManagementTableColumn } from "@/components/ui/ManagementTable";
import type { AttendanceRecord } from "@/types/attendance";

interface ManagerAttendanceFlaggedProps {
  rows: AttendanceRecord[];
  onRequestExplanation: (id: string) => void;
  onSendWarning: (id: string) => void;
  onNotifyLeader: (id: string) => void;
  onMarkReviewed: (id: string) => void;
}

export function ManagerAttendanceFlagged({
  rows,
  onRequestExplanation,
  onSendWarning,
  onNotifyLeader,
  onMarkReviewed
}: ManagerAttendanceFlaggedProps) {
  const columns: ManagementTableColumn<AttendanceRecord>[] = [
    {
      key: "technician",
      header: "Teknisi",
      sortValue: (row) => row.technicianName ?? "",
      render: (row) => (
        <div className="space-y-1">
          <p className="font-semibold text-gray-900">{row.technicianName}</p>
          <p className="text-xs text-gray-500">{row.userId ?? "Tanpa ID"}</p>
        </div>
      )
    },
    {
      key: "assignment",
      header: "Area / Leader",
      render: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-gray-800">{row.area ?? "-"}</p>
          <p className="text-xs text-gray-500">{row.leaderName ?? "Leader belum tersedia"}</p>
        </div>
      )
    },
    {
      key: "flagType",
      header: "Flag",
      sortValue: (row) => row.flagType ?? "",
      render: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-gray-800">{row.flagType}</p>
          <p className="text-xs text-gray-500">{row.checkInAt ?? row.date}</p>
        </div>
      )
    },
    {
      key: "reviewStatus",
      header: "Status Review",
      sortValue: (row) => row.reviewStatus ?? "",
      render: (row) => (
        <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
          {row.reviewStatus ?? "BELUM_DITINJAU"}
        </span>
      )
    },
    {
      key: "actions",
      header: "Aksi",
      render: (row) => (
        <div className="flex flex-wrap justify-end gap-2">
          <IconActionButton icon={<FileText size={16} />} label="Minta Penjelasan" onClick={() => onRequestExplanation(row.id)} />
          <IconActionButton icon={<TriangleAlert size={16} />} label="Kirim Peringatan" onClick={() => onSendWarning(row.id)} />
          <IconActionButton icon={<Bell size={16} />} label="Notifikasi Leader" onClick={() => onNotifyLeader(row.id)} />
          <IconActionButton icon={<Check size={16} />} label="Tandai Selesai Ditinjau" onClick={() => onMarkReviewed(row.id)} />
        </div>
      ),
      cellClassName: "text-right"
    }
  ];

  return (
    <Card title="Kontrol Disiplin Absensi">
      <ManagementTable
        data={rows}
        columns={columns}
        rowKey={(row) => row.id}
        emptyText="Tidak ada absensi bermasalah."
        searchPlaceholder="Cari teknisi, area, atau jenis flag"
        searchableText={(row) => [row.technicianName, row.area, row.leaderName, row.flagType, row.reviewStatus].filter(Boolean).join(" ")}
      />
    </Card>
  );
}
