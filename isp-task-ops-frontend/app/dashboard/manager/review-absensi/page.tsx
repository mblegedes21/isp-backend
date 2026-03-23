"use client";

import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { useAttendanceStore } from "@/store/useAttendanceStore";

export default function ManagerReviewAbsensiPage() {
  const history = useAttendanceStore((state) => state.history);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Review Absensi</h1>
      <Card title="Evaluasi Kehadiran Teknisi">
        <Table
          data={history}
          columns={[
            { header: "Tanggal", key: "tanggal", render: (row) => row.date },
            { header: "Check In", key: "in", render: (row) => row.checkInAt ?? "-" },
            { header: "Check Out", key: "out", render: (row) => row.checkOutAt ?? "-" },
            { header: "Hasil Review", key: "hasil", render: (row) => (row.flagged ? "Butuh Klarifikasi" : "Sesuai") }
          ]}
        />
      </Card>
    </div>
  );
}
