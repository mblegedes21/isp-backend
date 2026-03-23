"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { useTicketStore } from "@/store/useTicketStore";
import { useStockStore } from "@/store/useStockStore";
import { TicketMonitoringTable } from "@/components/monitoring/TicketMonitoringTable";
import { TechnicianMonitoring } from "@/components/monitoring/TechnicianMonitoring";
import { MaterialMonitoring } from "@/components/monitoring/MaterialMonitoring";

export default function LeaderMonitoringPage() {
  const tickets = useTicketStore((state) => state.tickets);
  const materials = useStockStore((state) => state.items);
  const ticketMaterialRequests = useStockStore((state) => state.ticketMaterialRequests);

  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);

  const defaultMaterialByProblem: Record<string, { name: string; qty: number; unit: string }> = {
    FIBER_BACKBONE_DOWN: { name: "Dropcore 1C", qty: 120, unit: "meter" },
    OLT_FAILURE: { name: "Fast Connector SC/APC", qty: 4, unit: "unit" },
    CUSTOMER_VIP: { name: "ONT Huawei HG8245H", qty: 1, unit: "unit" }
  };

  const materialRequestsByTicket = useMemo(
    () =>
      ticketMaterialRequests.reduce<Record<string, Array<{ materialId: string; qtyRequested: number }>>>((acc, current) => {
        if (!acc[current.ticketId]) {
          acc[current.ticketId] = [];
        }
        acc[current.ticketId].push({ materialId: current.materialId, qtyRequested: current.qtyRequested });
        return acc;
      }, {}),
    [ticketMaterialRequests]
  );

  const activeTickets = useMemo(
    () => tickets.filter((ticket) => ["ASSIGNED", "MATERIAL_PREPARED", "IN_PROGRESS", "PENDING_MANAGER_REVIEW"].includes(ticket.status)),
    [tickets]
  );

  const tiketSedangDikerjakan = tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length;
  const tiketMenungguReview = tickets.filter((ticket) => ticket.status === "PENDING_MANAGER_REVIEW").length;
  const tiketSelesaiHariIni = tickets.filter(
    (ticket) => ["COMPLETED", "CLOSED", "CLOSED_WITH_LOSS"].includes(ticket.status) && ticket.updatedAt.slice(0, 10) === todayIso
  ).length;
  const tiketTerlambat = activeTickets.filter((ticket) => {
    const createdAt = new Date(ticket.createdAt).getTime();
    const ageMs = Date.now() - createdAt;
    return ageMs > 1000 * 60 * 60 * 48;
  }).length;
  const materialBelumDiambil = activeTickets.filter((ticket) => {
    const hasRequested = (materialRequestsByTicket[ticket.id] ?? []).length > 0;
    return ticket.status === "ASSIGNED" && hasRequested;
  }).length;

  const ticketMonitoringRows = activeTickets.map((ticket) => {
    const requestRows = materialRequestsByTicket[ticket.id] ?? [];
    const requestedMaterials = requestRows.length > 0
      ? requestRows
          .map((row) => {
            const material = materials.find((item) => item.id === row.materialId);
            return material ? `${material.name} ${row.qtyRequested}${material.unit}` : `${row.materialId} ${row.qtyRequested}`;
          })
          .join(", ")
      : (() => {
          const fallback = defaultMaterialByProblem[ticket.problemType];
          return fallback ? `${fallback.name} ${fallback.qty}${fallback.unit}` : "-";
        })();

    const progressByStatus: Record<string, number> = {
      ASSIGNED: 15,
      MATERIAL_PREPARED: 30,
      IN_PROGRESS: 40,
      PENDING_MANAGER_REVIEW: 90
    };

    return {
      ticketId: ticket.id,
      area: ticket.branch,
      problemType: ticket.problemType,
      assignedTechnicians: ticket.assignee || "-",
      requestedMaterials,
      progress: progressByStatus[ticket.status] ?? 0,
      status: ticket.status
    };
  });

  const technicianMonitoringRows = useMemo(() => {
    const rows: Array<{ technicianName: string; currentTicket: string; workStatus: string; workDuration: string }> = [];

    activeTickets.forEach((ticket) => {
      const assignees = ticket.assignee
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);

      assignees.forEach((assignee) => {
        const start = new Date(ticket.updatedAt).getTime();
        const hour = Math.max(1, Math.floor((Date.now() - start) / (1000 * 60 * 60)));
        const workStatus = ticket.status === "IN_PROGRESS" ? "Aktif Bekerja" : ticket.status === "ASSIGNED" ? "Menunggu Mulai" : "Siap Tugas";

        rows.push({
          technicianName: assignee,
          currentTicket: ticket.id,
          workStatus,
          workDuration: `${hour} jam`
        });
      });
    });

    return rows;
  }, [activeTickets]);

  const materialMonitoringRows = useMemo(() => {
    const rows: Array<{
      ticket: string;
      material: string;
      requestedQty: string;
      approvedQty: string;
      usedQty: string;
      remainingQty: string;
    }> = [];

    activeTickets.forEach((ticket) => {
      const reqRows = materialRequestsByTicket[ticket.id];

      if (!reqRows || reqRows.length === 0) {
        const fallback = defaultMaterialByProblem[ticket.problemType];
        if (!fallback) return;

        const requested = fallback.qty;
        const approved = ticket.status === "ASSIGNED" ? 0 : requested;
        const used = ticket.status === "IN_PROGRESS" ? Math.floor(approved * 0.6) : 0;
        const remaining = Math.max(approved - used, 0);

        rows.push({
          ticket: ticket.id,
          material: fallback.name,
          requestedQty: `${requested} ${fallback.unit}`,
          approvedQty: `${approved} ${fallback.unit}`,
          usedQty: `${used} ${fallback.unit}`,
          remainingQty: `${remaining} ${fallback.unit}`
        });
        return;
      }

      reqRows.forEach((req) => {
        const material = materials.find((item) => item.id === req.materialId);
        const unit = material?.unit ?? "unit";
        const requested = req.qtyRequested;
        const approved = ["MATERIAL_PREPARED", "IN_PROGRESS", "PENDING_MANAGER_REVIEW"].includes(ticket.status) ? requested : 0;
        const used = ticket.status === "IN_PROGRESS" ? Math.floor(approved * 0.6) : ticket.status === "PENDING_MANAGER_REVIEW" ? approved : 0;
        const remaining = Math.max(approved - used, 0);

        rows.push({
          ticket: ticket.id,
          material: material?.name ?? req.materialId,
          requestedQty: `${requested} ${unit}`,
          approvedQty: `${approved} ${unit}`,
          usedQty: `${used} ${unit}`,
          remainingQty: `${remaining} ${unit}`
        });
      });
    });

    return rows;
  }, [activeTickets, materialRequestsByTicket, materials]);

  const alerts: string[] = [];
  if (activeTickets.some((ticket) => Date.now() - new Date(ticket.createdAt).getTime() > 1000 * 60 * 60 * 36)) {
    alerts.push("SLA hampir terlewati pada beberapa tiket aktif.");
  }
  if (technicianMonitoringRows.some((row) => row.workStatus === "Menunggu Mulai" && Number(row.workDuration.split(" ")[0]) >= 4)) {
    alerts.push("Ada teknisi tidak aktif (belum mulai kerja lebih dari 4 jam).");
  }
  if (materialMonitoringRows.some((row) => Number(row.approvedQty.split(" ")[0]) === 0 && Number(row.requestedQty.split(" ")[0]) > 0)) {
    alerts.push("Ada material belum diambil dari gudang.");
  }
  if (tiketTerlambat > 0) {
    alerts.push(`Terdapat ${tiketTerlambat} tiket terlambat.`);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Monitoring Operasional Leader</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Sedang Dikerjakan" value={tiketSedangDikerjakan} />
        <StatCard title="Menunggu Review" value={tiketMenungguReview} />
        <StatCard title="Selesai Hari Ini" value={tiketSelesaiHariIni} />
        <StatCard title="Tiket Terlambat" value={tiketTerlambat} />
        <StatCard title="Material Belum Diambil" value={materialBelumDiambil} />
      </div>

      <TicketMonitoringTable rows={ticketMonitoringRows} />

      <TechnicianMonitoring rows={technicianMonitoringRows} />

      <MaterialMonitoring rows={materialMonitoringRows} />

      <Card title="Sistem Peringatan">
        {alerts.length > 0 ? (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert} className="flex items-center gap-2">
                <Badge tone="danger">Peringatan</Badge>
                <p className="text-sm text-gray-700">{alert}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Badge tone="success">Aman</Badge>
            <p className="text-sm text-gray-700">Belum ada peringatan operasional.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
