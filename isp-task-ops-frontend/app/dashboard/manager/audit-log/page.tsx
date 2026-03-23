"use client";

import { useState } from "react";
import { ManagerAuditLog } from "@/components/dashboard/ManagerAuditLog";
import { Card } from "@/components/ui/Card";
import { useManagerStore } from "@/store/useManagerStore";

export default function ManagerAuditLogPage() {
  const auditLogs = useManagerStore((state) => state.auditLogs);
  const investigateAuditUser = useManagerStore((state) => state.investigateAuditUser);
  const requestAuditClarification = useManagerStore((state) => state.requestAuditClarification);
  const markAuditReviewed = useManagerStore((state) => state.markAuditReviewed);
  const [message, setMessage] = useState("");

  const showMessage = (value: string) => {
    setMessage(value);
    window.setTimeout(() => setMessage(""), 2400);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-sm text-gray-600">Pusat akuntabilitas operasional untuk melacak tindakan penting dan menindak entri yang mencurigakan.</p>
      </div>

      {message ? (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          {message}
        </div>
      ) : null}

      <Card title="Ringkasan Audit">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Log</p>
            <p className="mt-2 text-3xl font-bold">{auditLogs.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Perlu Review</p>
            <p className="mt-2 text-3xl font-bold">{auditLogs.filter((log) => log.reviewStatus !== "SELESAI").length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sudah Selesai</p>
            <p className="mt-2 text-3xl font-bold">{auditLogs.filter((log) => log.reviewStatus === "SELESAI").length}</p>
          </div>
        </div>
      </Card>

      <ManagerAuditLog
        logs={auditLogs}
        onInvestigate={async (id) => {
          await investigateAuditUser(id);
          showMessage(`Investigasi user untuk log ${id} dimulai.`);
        }}
        onClarify={async (id) => {
          await requestAuditClarification(id);
          showMessage(`Permintaan klarifikasi untuk log ${id} telah dikirim.`);
        }}
        onReviewed={async (id) => {
          await markAuditReviewed(id);
          showMessage(`Log ${id} ditandai selesai ditinjau.`);
        }}
      />
    </div>
  );
}
