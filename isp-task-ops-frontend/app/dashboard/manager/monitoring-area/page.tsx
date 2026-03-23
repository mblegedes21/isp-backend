"use client";

import { useMemo, useState } from "react";
import { ManagerAreaStatus } from "@/components/dashboard/ManagerAreaStatus";
import { ManagerIncidentPanel } from "@/components/dashboard/ManagerIncidentPanel";
import { ManagerTechnicianMap } from "@/components/dashboard/ManagerTechnicianMap";
import { Card } from "@/components/ui/Card";
import { mockAreaBaselines } from "@/lib/mock-data";
import { buildAreaMetrics } from "@/lib/manager-insights";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useManagerStore } from "@/store/useManagerStore";
import { useStockStore } from "@/store/useStockStore";
import { useTicketStore } from "@/store/useTicketStore";
import { useTrackingStore } from "@/store/useTrackingStore";

export default function ManagerMonitoringAreaPage() {
  const tickets = useTicketStore((state) => state.tickets);
  const getTodayRecords = useAttendanceStore((state) => state.getTodayRecords);
  const ticketMaterialRequests = useStockStore((state) => state.ticketMaterialRequests);
  const areaActions = useManagerStore((state) => state.areaActions);
  const recordAreaAction = useManagerStore((state) => state.recordAreaAction);
  const incidents = useManagerStore((state) => state.incidents);
  const respondToIncident = useManagerStore((state) => state.respondToIncident);
  const addAuditLog = useManagerStore((state) => state.addAuditLog);
  const locationLogs = useTrackingStore((state) => state.locationLogs);
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
  const latestTechnicianLocations = useMemo(() => {
    const unique = new Map<string, (typeof locationLogs)[number]>();
    for (const log of locationLogs) {
      if (!unique.has(log.userId)) unique.set(log.userId, log);
    }
    return Array.from(unique.values());
  }, [locationLogs]);

  const showMessage = (value: string) => {
    setMessage(value);
    window.setTimeout(() => setMessage(""), 2400);
  };

  const handleAreaAction = async (areaName: string, action: string) => {
    await recordAreaAction(areaName, action);
    await addAuditLog({
      user: "manager@isp.local",
      actionType: "AREA_MONITORING_ACTION",
      entityType: "Area",
      entityId: areaName,
      before: "Monitoring",
      after: action,
      source: "Modul Monitoring Area"
    });
    showMessage(`${action} untuk area ${areaName} berhasil dicatat.`);
  };

  const handleIncidentAction = async (incidentId: string, action: string) => {
    const incident = incidents.find((item) => item.id === incidentId);
    if (!incident) return;
    await respondToIncident(incidentId, action);
    await addAuditLog({
      user: "manager@isp.local",
      actionType: "INCIDENT_RESPONSE",
      entityType: "Incident",
      entityId: incidentId,
      before: incident.responseStatus,
      after: action,
      source: "Modul Monitoring Area"
    });
    showMessage(`${action} untuk area ${incident.areaName} berhasil dilakukan.`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Monitoring Area</h1>
        <p className="text-sm text-gray-600">Panel kesehatan jaringan per area untuk deteksi insiden, respons network, dan notifikasi operasional.</p>
      </div>

      {message ? (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          {message}
        </div>
      ) : null}

      <Card title="Ringkasan Monitoring">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Area Normal</p>
            <p className="mt-2 text-3xl font-bold">{areaMetrics.filter((area) => area.status === "HIJAU").length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Beban Tinggi</p>
            <p className="mt-2 text-3xl font-bold">{areaMetrics.filter((area) => area.status === "KUNING").length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Insiden</p>
            <p className="mt-2 text-3xl font-bold">{areaMetrics.filter((area) => area.status === "MERAH").length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Insiden Terdeteksi</p>
            <p className="mt-2 text-3xl font-bold">{incidents.length}</p>
          </div>
        </div>
      </Card>

      <ManagerAreaStatus
        rows={areaMetrics.map((area) => ({
          areaId: area.areaId,
          areaName: area.areaName,
          status: area.status,
          openTickets: area.openTickets,
          escalatedTickets: area.escalatedTickets,
          slaCompliance: area.slaCompliance
        }))}
        onAction={handleAreaAction}
      />

      <ManagerTechnicianMap rows={latestTechnicianLocations} />

      <ManagerIncidentPanel rows={incidents} onAction={handleIncidentAction} />
    </div>
  );
}
