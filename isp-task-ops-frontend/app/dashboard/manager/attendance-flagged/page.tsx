"use client";

import { useMemo, useState } from "react";
import { ManagerAttendanceFlagged } from "@/components/dashboard/ManagerAttendanceFlagged";
import { Card } from "@/components/ui/Card";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useManagerStore } from "@/store/useManagerStore";

export default function ManagerAttendanceFlaggedPage() {
  const history = useAttendanceStore((state) => state.history);
  const requestExplanation = useAttendanceStore((state) => state.requestExplanation);
  const sendWarning = useAttendanceStore((state) => state.sendWarning);
  const notifyLeader = useAttendanceStore((state) => state.notifyLeader);
  const markReviewed = useAttendanceStore((state) => state.markReviewed);
  const addAuditLog = useManagerStore((state) => state.addAuditLog);
  const [message, setMessage] = useState("");
  const flaggedRecords = useMemo(() => history.filter((record) => record.flagged), [history]);

  const showMessage = (value: string) => {
    setMessage(value);
    window.setTimeout(() => setMessage(""), 2400);
  };

  const registerAction = async (id: string, action: string) => {
    const record = flaggedRecords.find((item) => item.id === id);
    if (!record) return;

    await addAuditLog({
      user: "manager@isp.local",
      actionType: "ATTENDANCE_REVIEWED",
      entityType: "Attendance",
      entityId: id,
      before: record.reviewStatus ?? "BELUM_DITINJAU",
      after: action,
      source: "Modul Absensi Flagged"
    });

    showMessage(`${action} untuk ${record.technicianName} berhasil dilakukan.`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Absensi Flagged</h1>
        <p className="text-sm text-gray-600">Modul kontrol disiplin untuk menindak keterlambatan, tidak hadir, check-out kosong, dan kasus absensi bermasalah.</p>
      </div>

      {message ? (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          {message}
        </div>
      ) : null}

      <Card title="Ringkasan Disiplin">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Terlambat</p>
            <p className="mt-2 text-3xl font-bold">{flaggedRecords.filter((record) => record.flagType === "TERLAMBAT").length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tidak Check-out</p>
            <p className="mt-2 text-3xl font-bold">{flaggedRecords.filter((record) => record.flagType === "TIDAK_CHECK_OUT").length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tidak Hadir</p>
            <p className="mt-2 text-3xl font-bold">{flaggedRecords.filter((record) => record.flagType === "TIDAK_HADIR").length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Belum Ditinjau</p>
            <p className="mt-2 text-3xl font-bold">{flaggedRecords.filter((record) => record.reviewStatus === "BELUM_DITINJAU").length}</p>
          </div>
        </div>
      </Card>

      <ManagerAttendanceFlagged
        rows={flaggedRecords}
        onRequestExplanation={async (id) => {
          await requestExplanation(id);
          await registerAction(id, "Minta Penjelasan");
        }}
        onSendWarning={async (id) => {
          await sendWarning(id);
          await registerAction(id, "Kirim Peringatan");
        }}
        onNotifyLeader={async (id) => {
          await notifyLeader(id);
          await registerAction(id, "Notifikasi Leader");
        }}
        onMarkReviewed={async (id) => {
          await markReviewed(id);
          await registerAction(id, "Tandai Selesai Ditinjau");
        }}
      />
    </div>
  );
}
