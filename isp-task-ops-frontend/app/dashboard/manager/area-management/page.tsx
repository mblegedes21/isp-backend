"use client";

import { useMemo, useState } from "react";
import { ManagerAreaControl } from "@/components/dashboard/ManagerAreaControl";
import { Card } from "@/components/ui/Card";
import { mockAreaBaselines } from "@/lib/mock-data";
import { buildAreaMetrics } from "@/lib/manager-insights";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useManagerStore } from "@/store/useManagerStore";
import { useStockStore } from "@/store/useStockStore";
import { useTicketStore } from "@/store/useTicketStore";

export default function ManagerAreaManagementPage() {
  const tickets = useTicketStore((state) => state.tickets);
  const getTodayRecords = useAttendanceStore((state) => state.getTodayRecords);
  const ticketMaterialRequests = useStockStore((state) => state.ticketMaterialRequests);
  const areaActions = useManagerStore((state) => state.areaActions);
  const recordAreaAction = useManagerStore((state) => state.recordAreaAction);
  const addAuditLog = useManagerStore((state) => state.addAuditLog);
  const [message, setMessage] = useState("");

  const todayAttendance = getTodayRecords();
  const areaMetrics = useMemo(
    () =>
      buildAreaMetrics({
        baselines: mockAreaBaselines,
        tickets,
        todayAttendance,
        ticketMaterialRequests,
        areaActions
      }),
    [areaActions, ticketMaterialRequests, tickets, todayAttendance]
  );

  const showMessage = (value: string) => {
    setMessage(value);
    window.setTimeout(() => setMessage(""), 2400);
  };

  const handleAreaAction = async (areaName: string, action: string) => {
    await recordAreaAction(areaName, action);
    await addAuditLog({
      user: "manager@isp.local",
      actionType: "AREA_ACTION",
      entityType: "Area",
      entityId: areaName,
      before: "Belum ada intervensi baru",
      after: action,
      source: "Modul Kontrol Area"
    });
    showMessage(`${action} untuk ${areaName} berhasil dicatat.`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Kontrol Area</h1>
        <p className="text-sm text-gray-600">Modul operasional area untuk memantau SLA, repeat fault, eskalasi, dan melakukan intervensi langsung.</p>
      </div>

      {message ? (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          {message}
        </div>
      ) : null}

      <Card title="Ringkasan Kondisi Area">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Area Merah</p>
            <p className="mt-2 text-3xl font-bold">{areaMetrics.filter((area) => area.status === "MERAH").length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Area Kuning</p>
            <p className="mt-2 text-3xl font-bold">{areaMetrics.filter((area) => area.status === "KUNING").length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Repeat Fault Tinggi</p>
            <p className="mt-2 text-3xl font-bold">{areaMetrics.filter((area) => area.repeatFaults >= 5).length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">SLA di Bawah 85%</p>
            <p className="mt-2 text-3xl font-bold">{areaMetrics.filter((area) => area.slaCompliance < 85).length}</p>
          </div>
        </div>
      </Card>

      <ManagerAreaControl rows={areaMetrics} onAction={handleAreaAction} />
    </div>
  );
}
