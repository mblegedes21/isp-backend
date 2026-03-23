import { getAreaOperationalStatus } from "@/lib/business-rules";
import type { AttendanceRecord } from "@/types/attendance";
import type { AreaActionRecord, AreaBaseline } from "@/types/operations";
import type { Ticket } from "@/types/ticket";
import type { TicketMaterialRequest } from "@/types/stock";

const activeTicketStatuses: string[] = ["CREATED", "ASSIGNED", "MATERIAL_PREPARED", "IN_PROGRESS", "ESCALATED", "PENDING_MANAGER_REVIEW"];

export interface DerivedAreaMetric {
  areaId: string;
  areaName: string;
  openTickets: number;
  escalatedTickets: number;
  slaCompliance: number;
  averageRepairHours: number;
  activeTechnicians: number;
  materialUsageToday: number;
  repeatFaults: number;
  status: "HIJAU" | "KUNING" | "MERAH";
  lastAction?: string;
}

export function buildAreaMetrics({
  baselines,
  tickets,
  todayAttendance,
  ticketMaterialRequests,
  areaActions
}: {
  baselines: AreaBaseline[];
  tickets: Ticket[];
  todayAttendance: AttendanceRecord[];
  ticketMaterialRequests: TicketMaterialRequest[];
  areaActions: AreaActionRecord[];
}): DerivedAreaMetric[] {
  const materialUsageByArea = ticketMaterialRequests.reduce<Map<string, number>>((acc, request) => {
    const ticket = tickets.find((item) => item.id === request.ticketId);
    if (!ticket) return acc;
    acc.set(ticket.branch, (acc.get(ticket.branch) ?? 0) + request.qtyRequested);
    return acc;
  }, new Map());

  const latestAreaAction = new Map(areaActions.map((item) => [item.areaName, item.action]));

  return baselines.map((baseline) => {
    const areaTickets = tickets.filter((ticket) => ticket.areaId === baseline.areaId);
    const openTickets = areaTickets.filter((ticket) => activeTicketStatuses.includes(ticket.status)).length;
    const escalatedTickets = areaTickets.filter((ticket) => ticket.escalated || ticket.status === "ESCALATED").length;
    const activeTechnicians = todayAttendance.filter((record) => record.area === baseline.areaName && record.checkInAt).length;
    const repeatFaults = baseline.repeatFaults + Math.max(0, escalatedTickets - 1);
    const slaPressure = areaTickets.filter((ticket) => ticket.status === "ESCALATED" || ticket.status === "PENDING_MANAGER_REVIEW").length;
    const slaCompliance = Math.max(65, Math.round(baseline.slaCompliance - slaPressure * 4 - escalatedTickets * 3));
    const materialUsageToday = materialUsageByArea.get(baseline.areaName) ?? 0;

    return {
      areaId: baseline.areaId,
      areaName: baseline.areaName,
      openTickets,
      escalatedTickets,
      slaCompliance,
      averageRepairHours: baseline.averageRepairHours,
      activeTechnicians,
      materialUsageToday,
      repeatFaults,
      status: getAreaOperationalStatus({
        areaId: baseline.areaId,
        areaName: baseline.areaName,
        openTickets,
        escalatedTickets,
        slaCompliance,
        averageRepairHours: baseline.averageRepairHours,
        activeTechnicians,
        materialUsageToday,
        repeatFaults
      }),
      lastAction: latestAreaAction.get(baseline.areaName)
    };
  });
}
