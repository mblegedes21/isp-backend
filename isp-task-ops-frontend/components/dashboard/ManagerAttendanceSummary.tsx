"use client";

import { Card } from "@/components/ui/Card";

interface ManagerAttendanceSummaryProps {
  hadir: number;
  terlambat: number;
  belumCheckIn: number;
}

export function ManagerAttendanceSummary({
  hadir,
  terlambat,
  belumCheckIn
}: ManagerAttendanceSummaryProps) {
  return (
    <Card title="Ringkasan Absensi">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Teknisi Hadir</p>
          <p className="mt-2 text-3xl font-bold text-app-text">{hadir}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Terlambat</p>
          <p className="mt-2 text-3xl font-bold text-app-text">{terlambat}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Belum Check-in</p>
          <p className="mt-2 text-3xl font-bold text-app-text">{belumCheckIn}</p>
        </div>
      </div>
    </Card>
  );
}
