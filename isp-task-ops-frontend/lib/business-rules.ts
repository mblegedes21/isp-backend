import type { AttendanceRecord } from "@/types/attendance";
import type { AreaOperationalMetric } from "@/types/operations";
import type { Role } from "@/types/role";
import type { Ticket, TicketStatus } from "@/types/ticket";
import { TICKET_STATUS_ORDER } from "@/types/ticket";

export const PRIORITY_SLA_HOURS: Record<Ticket["priority"], number> = {
  LOW: 24,
  MEDIUM: 12,
  HIGH: 8,
  CRITICAL: 4
};

export const canTransitionTicketStatus = (current: TicketStatus, next: TicketStatus): boolean => {
  const currentIndex = TICKET_STATUS_ORDER.indexOf(current);
  const nextIndex = TICKET_STATUS_ORDER.indexOf(next);
  return nextIndex === currentIndex + 1;
};

export const canEditTicket = (status: TicketStatus): boolean => {
  const lockedAt = TICKET_STATUS_ORDER.indexOf("IN_PROGRESS");
  return TICKET_STATUS_ORDER.indexOf(status) < lockedAt;
};

export const canRoleUpdateTicket = (role: Role): boolean => {
  return role === "NOC" || role === "LEADER" || role === "MANAGER";
};

export const canRoleEscalate = (role: Role): boolean => {
  return role === "NOC" || role === "LEADER";
};

export const calculateDurationHours = (createdAt: string): number => {
  const diff = Date.now() - new Date(createdAt).getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60)));
};

export const getTicketSlaState = (ticket: Ticket): {
  durationHours: number;
  slaHours: number;
  state: "AMAN" | "MENDEKATI_SLA" | "LEWAT_SLA";
} => {
  const durationHours = calculateDurationHours(ticket.createdAt);
  const slaHours = PRIORITY_SLA_HOURS[ticket.priority];

  if (durationHours >= slaHours) {
    return { durationHours, slaHours, state: "LEWAT_SLA" };
  }

  if (durationHours >= slaHours * 0.8) {
    return { durationHours, slaHours, state: "MENDEKATI_SLA" };
  }

  return { durationHours, slaHours, state: "AMAN" };
};

export const getAreaOperationalStatus = (metric: AreaOperationalMetric): "HIJAU" | "KUNING" | "MERAH" => {
  if (metric.openTickets >= 3 || metric.escalatedTickets >= 1 || metric.slaCompliance < 85 || metric.repeatFaults >= 5) {
    return "MERAH";
  }

  if (metric.openTickets >= 2 || metric.slaCompliance < 92 || metric.repeatFaults >= 3) {
    return "KUNING";
  }

  return "HIJAU";
};

export const isMaterialUsageAbnormal = (todayUsage: number, averageUsage: number): boolean => {
  if (averageUsage <= 0) return todayUsage > 0;
  return todayUsage > averageUsage * 1.35;
};

export const shouldCreateIncident = (metric: AreaOperationalMetric): boolean => {
  return metric.openTickets >= 3 || metric.escalatedTickets >= 1 || metric.repeatFaults >= 5 || metric.slaCompliance < 85;
};

export const getAttendanceFlagLabel = (record: AttendanceRecord): string => {
  if (record.flagType) return record.flagType;

  if (!record.checkInAt) return "TIDAK_HADIR";
  if (!record.checkOutAt) return "TIDAK_CHECK_OUT";
  return "TERLAMBAT";
};
