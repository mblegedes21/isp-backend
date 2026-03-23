"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { useTicketStore } from "@/store/useTicketStore";
import { useStockStore } from "@/store/useStockStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { LeaderKPI } from "@/components/dashboard/LeaderKPI";
import { LeaderTicketTable } from "@/components/dashboard/LeaderTicketTable";
import { TechnicianMonitor } from "@/components/dashboard/TechnicianMonitor";
import { MaterialMonitor } from "@/components/dashboard/MaterialMonitor";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

export default function LeaderPage() {
  const tickets = useTicketStore((state) => state.tickets);
  const materials = useStockStore((state) => state.items);
  const ticketMaterialRequests = useStockStore((state) => state.ticketMaterialRequests);
  const statusAbsensiLeader = useAttendanceStore((state) => state.statusText);

  const activeTickets = useMemo(
    () => tickets.filter((ticket) => !["COMPLETED", "CLOSED", "CLOSED_WITH_LOSS"].includes(ticket.status)),
    [tickets]
  );

  const ticketRows = activeTickets.map((ticket) => {
    const progressMap: Record<string, number> = {
      CREATED: 0,
      ASSIGNED: 20,
      MATERIAL_PREPARED: 35,
      IN_PROGRESS: 65,
      ESCALATED: 70,
      PENDING_MANAGER_REVIEW: 90
    };

    return {
      ticketId: ticket.id,
      area: ticket.branch,
      problemType: ticket.problemType,
      assignedTechnicians: ticket.assignee || "-",
      progress: progressMap[ticket.status] ?? 0,
      status: ticket.status
    };
  });

  const technicianRows = useMemo(() => {
    const rows: Array<{
      technicianName: string;
      currentTicket: string;
      workStatus: "Idle" | "Menuju Lokasi" | "Sedang Kerja" | "Selesai";
      workDuration: string;
    }> = [];

    activeTickets.forEach((ticket) => {
      const assignees = (ticket.assignee ?? "")
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);

      if (assignees.length === 0) return;

      assignees.forEach((assignee) => {
        const durationHour = Math.max(
          1,
          Math.floor((Date.now() - new Date(ticket.updatedAt ?? ticket.createdAt ?? Date.now()).getTime()) / (1000 * 60 * 60))
        );
        let workStatus: "Idle" | "Menuju Lokasi" | "Sedang Kerja" | "Selesai" = "Idle";

        if (ticket.status === "ASSIGNED" || ticket.status === "MATERIAL_PREPARED") {
          workStatus = "Menuju Lokasi";
        } else if (ticket.status === "IN_PROGRESS" || ticket.status === "ESCALATED") {
          workStatus = "Sedang Kerja";
        } else if (ticket.status === "PENDING_MANAGER_REVIEW") {
          workStatus = "Selesai";
        }

        rows.push({
          technicianName: assignee,
          currentTicket: ticket.id,
          workStatus,
          workDuration: `${durationHour} jam`
        });
      });
    });

    if (rows.length === 0) {
      rows.push({
        technicianName: "Belum Ada Penugasan",
        currentTicket: "-",
        workStatus: "Idle",
        workDuration: "-"
      });
    }

    return rows;
  }, [activeTickets]);

  const materialRows = useMemo(() => {
    const rows: Array<{
      ticket: string;
      material: string;
      requested: string;
      approved: string;
      used: string;
      remaining: string;
    }> = [];

    ticketMaterialRequests.forEach((request) => {
      const ticket = tickets.find((item) => item.id === request.ticketId);
      const material = materials.find((item) => item.id === request.materialId);

      const requestedQty = request.qtyRequested;
      const approvedQty = ticket && ["MATERIAL_PREPARED", "IN_PROGRESS", "PENDING_MANAGER_REVIEW"].includes(ticket.status) ? requestedQty : 0;
      const usedQty = ticket && ["IN_PROGRESS", "PENDING_MANAGER_REVIEW"].includes(ticket.status) ? Math.floor(approvedQty * 0.7) : 0;
      const remainingQty = Math.max(approvedQty - usedQty, 0);
      const unit = material?.unit ?? "unit";

      rows.push({
        ticket: request.ticketId,
        material: material?.name ?? request.materialId,
        requested: `${requestedQty} ${unit}`,
        approved: `${approvedQty} ${unit}`,
        used: `${usedQty} ${unit}`,
        remaining: `${remainingQty} ${unit}`
      });
    });

    return rows;
  }, [ticketMaterialRequests, tickets, materials]);

  const priorityRows = activeTickets
    .map((ticket) => {
      const slaHoursByPriority: Record<string, number> = {
        CRITICAL: 8,
        HIGH: 12,
        MEDIUM: 24,
        LOW: 36
      };

      const maxSlaHours = slaHoursByPriority[ticket.priority] ?? 24;
      const elapsedHours = (Date.now() - new Date(ticket.createdAt ?? Date.now()).getTime()) / (1000 * 60 * 60);
      const remaining = Math.round(maxSlaHours - elapsedHours);

      return {
        ticket: ticket.id,
        area: ticket.branch,
        slaRemaining: remaining <= 0 ? `Lewat ${Math.abs(remaining)} jam` : `${remaining} jam`,
        status: ticket.status,
        rawRemaining: remaining
      };
    })
    .filter((item) => item.rawRemaining <= 6)
    .sort((a, b) => a.rawRemaining - b.rawRemaining);

  const activityItems = useMemo(() => {
    const events: Array<{ id: string; message: string; time: number; timeLabel: string }> = [];

    tickets.forEach((ticket) => {
      const assignee = (ticket.assignee ?? "").split(",")[0]?.trim();
      if (assignee && ticket.status === "IN_PROGRESS") {
        events.push({
          id: `progress-${ticket.id}`,
          message: `${assignee} memulai pekerjaan pada ${ticket.id}`,
          time: new Date(ticket.updatedAt ?? ticket.createdAt ?? Date.now()).getTime(),
          timeLabel: new Date(ticket.updatedAt ?? ticket.createdAt ?? Date.now()).toLocaleString("id-ID")
        });
      }

      if (["COMPLETED", "PENDING_MANAGER_REVIEW"].includes(ticket.status)) {
        events.push({
          id: `done-${ticket.id}`,
          message: `Ticket ${ticket.id} selesai`,
          time: new Date(ticket.updatedAt ?? ticket.createdAt ?? Date.now()).getTime(),
          timeLabel: new Date(ticket.updatedAt ?? ticket.createdAt ?? Date.now()).toLocaleString("id-ID")
        });
      }
    });

    ticketMaterialRequests.forEach((request) => {
      const material = materials.find((item) => item.id === request.materialId);
      events.push({
        id: `material-${request.id}`,
        message: `Material ${material?.name ?? request.materialId} diambil untuk ${request.ticketId}`,
        time: new Date(request.createdAt ?? Date.now()).getTime(),
        timeLabel: new Date(request.createdAt ?? Date.now()).toLocaleString("id-ID")
      });
    });

    return events.sort((a, b) => b.time - a.time).slice(0, 6);
  }, [tickets, ticketMaterialRequests, materials]);

  const materialPending = ticketMaterialRequests.filter((request) => {
    const ticket = tickets.find((item) => item.id === request.ticketId);
    return ticket ? ["ASSIGNED", "CREATED"].includes(ticket.status) : true;
  }).length;

  const teknisiAktif = technicianRows.filter((row) => row.workStatus === "Menuju Lokasi" || row.workStatus === "Sedang Kerja").length;
  const totalTeknisiTim = 6;
  const teknisiHadirHariIni = Math.min(teknisiAktif + 1, totalTeknisiTim);
  const teknisiBelumAbsen = Math.max(totalTeknisiTim - teknisiHadirHariIni, 0);
  const leaderStatusMap: Record<string, string> = {
    "Not checked in": "Belum Check In",
    "Checked in": "Sudah Check In",
    "Checked out": "Sudah Check Out"
  };
  const leaderStatus = leaderStatusMap[statusAbsensiLeader] ?? statusAbsensiLeader;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard Leader</h1>

      <LeaderKPI
        ticketAktif={activeTickets.length}
        sedangDikerjakan={tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length}
        menungguReview={tickets.filter((ticket) => ticket.status === "PENDING_MANAGER_REVIEW").length}
        ticketEskalasi={tickets.filter((ticket) => ticket.escalated || ticket.status === "ESCALATED").length}
        teknisiAktif={teknisiAktif}
        materialPending={materialPending}
      />

      <Card title="Monitoring Absensi Hari Ini">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-md border border-gray-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Teknisi Hadir Hari Ini</p>
            <p className="mt-1 text-2xl font-bold">{teknisiHadirHariIni}</p>
          </div>
          <div className="rounded-md border border-gray-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Teknisi Belum Absen</p>
            <p className="mt-1 text-2xl font-bold">{teknisiBelumAbsen}</p>
          </div>
          <div className="rounded-md border border-gray-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Leader Status</p>
            <p className="mt-1 text-2xl font-bold">{leaderStatus}</p>
          </div>
        </div>
      </Card>

      <LeaderTicketTable rows={ticketRows} />

      <TechnicianMonitor rows={technicianRows} />

      <MaterialMonitor rows={materialRows} />

      <Card title="Tiket Prioritas">
        <Table
          data={priorityRows}
          emptyText="Belum ada tiket mendekati pelanggaran SLA."
          columns={[
            { header: "Tiket", key: "ticket", render: (row) => <span className="font-semibold">{row.ticket}</span> },
            { header: "Area", key: "area", render: (row) => row.area },
            { header: "Sisa SLA", key: "sla", render: (row) => row.slaRemaining },
            {
              header: "Status",
              key: "status",
              render: (row) => (
                <Badge tone={row.rawRemaining <= 0 ? "danger" : "warning"}>
                  {row.status}
                </Badge>
              )
            }
          ]}
        />
      </Card>

      <RecentActivity items={activityItems} />
    </div>
  );
}
