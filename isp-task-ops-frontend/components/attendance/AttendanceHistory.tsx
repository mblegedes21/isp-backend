"use client";

import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";

export interface LeaderAttendanceHistoryItem {
  tanggal: string;
  checkIn: string;
  checkOut: string;
  lokasi: string;
}

interface AttendanceHistoryProps {
  rows: LeaderAttendanceHistoryItem[];
}

export function AttendanceHistory({ rows }: AttendanceHistoryProps) {
  return (
    <Card title="Riwayat Absensi">
      <Table
        data={rows}
        emptyText="Belum ada riwayat absensi."
        columns={[
          { header: "Tanggal", key: "tanggal", render: (row) => row.tanggal },
          { header: "Check In", key: "checkIn", render: (row) => row.checkIn || "-" },
          { header: "Check Out", key: "checkOut", render: (row) => row.checkOut || "-" },
          { header: "Lokasi", key: "lokasi", render: (row) => row.lokasi || "-" }
        ]}
      />
    </Card>
  );
}
