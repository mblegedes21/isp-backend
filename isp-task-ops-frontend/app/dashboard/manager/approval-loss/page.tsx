"use client";

import { useState } from "react";
import { ManagerLossApproval } from "@/components/dashboard/ManagerLossApproval";
import { Card } from "@/components/ui/Card";
import { useManagerStore } from "@/store/useManagerStore";
import { useStockStore } from "@/store/useStockStore";

export default function ManagerApprovalLossPage() {
  const losses = useStockStore((state) => state.losses);
  const approveLoss = useStockStore((state) => state.approveLoss);
  const rejectLoss = useStockStore((state) => state.rejectLoss);
  const startLossInvestigation = useStockStore((state) => state.startLossInvestigation);
  const addAuditLog = useManagerStore((state) => state.addAuditLog);
  const [message, setMessage] = useState("");

  const showMessage = (value: string) => {
    setMessage(value);
    window.setTimeout(() => setMessage(""), 2400);
  };

  const pushAudit = async (entityId: string, actionType: string, before: string, after: string) => {
    await addAuditLog({
      user: "manager@isp.local",
      actionType,
      entityType: "Loss",
      entityId,
      before,
      after,
      source: "Modul Persetujuan Loss"
    });
  };

  const handleApprove = async (id: string) => {
    const loss = losses.find((item) => item.id === id);
    if (!loss) return;
    await approveLoss(id);
    await pushAudit(id, "LOSS_APPROVED", loss.status, "DISETUJUI");
    showMessage(`Loss ${id} disetujui.`);
  };

  const handleReject = async (id: string, reason: string) => {
    const loss = losses.find((item) => item.id === id);
    if (!loss) return;
    await rejectLoss(id, reason);
    await pushAudit(id, "LOSS_REJECTED", loss.status, `DITOLAK: ${reason}`);
    showMessage(`Loss ${id} ditolak.`);
  };

  const handleInvestigate = async (id: string) => {
    const loss = losses.find((item) => item.id === id);
    if (!loss) return;
    await startLossInvestigation(id);
    await pushAudit(id, "LOSS_INVESTIGATION", loss.status, "DALAM_INVESTIGASI");
    showMessage(`Investigasi untuk ${id} dimulai.`);
  };

  const handleRequestEvidence = async (id: string) => {
    const loss = losses.find((item) => item.id === id);
    if (!loss) return;
    await pushAudit(id, "LOSS_EVIDENCE_REQUESTED", loss.status, "BUKTI_TAMBAHAN_DIMINTA");
    showMessage(`Permintaan bukti tambahan untuk ${id} telah dicatat.`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Persetujuan Loss</h1>
        <p className="text-sm text-gray-600">Panel kontrol untuk memutuskan approval loss, penolakan, investigasi, dan permintaan bukti tambahan.</p>
      </div>

      {message ? (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          {message}
        </div>
      ) : null}

      <Card title="Ringkasan Loss">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Menunggu</p>
            <p className="mt-2 text-3xl font-bold">{losses.filter((loss) => loss.status === "MENUNGGU").length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Dalam Investigasi</p>
            <p className="mt-2 text-3xl font-bold">{losses.filter((loss) => loss.status === "DALAM_INVESTIGASI").length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Disetujui</p>
            <p className="mt-2 text-3xl font-bold">{losses.filter((loss) => loss.status === "DISETUJUI").length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ditolak</p>
            <p className="mt-2 text-3xl font-bold">{losses.filter((loss) => loss.status === "DITOLAK").length}</p>
          </div>
        </div>
      </Card>

      <ManagerLossApproval
        losses={losses}
        onApprove={handleApprove}
        onReject={handleReject}
        onInvestigate={handleInvestigate}
        onRequestEvidence={handleRequestEvidence}
      />
    </div>
  );
}
