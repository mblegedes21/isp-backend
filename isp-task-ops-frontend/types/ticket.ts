export const TICKET_STATUS = {
  CREATED: "CREATED",
  ASSIGNED: "ASSIGNED",
  MATERIAL_PREPARED: "MATERIAL_PREPARED",
  IN_PROGRESS: "IN_PROGRESS",
  ESCALATED: "ESCALATED",
  COMPLETED: "COMPLETED",
  PENDING_MANAGER_REVIEW: "PENDING_MANAGER_REVIEW",
  CLOSED: "CLOSED",
  CLOSED_WITH_LOSS: "CLOSED_WITH_LOSS"
} as const;

export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

export type EscalationType =
  | "disaster"
  | "external_blocker"
  | "permit_issue"
  | "technical_blocker"
  | "safety_issue"
  | "operational_issue"
  | "emergency";

export type EscalationSeverity = "low" | "medium" | "high" | "critical";
export type EscalationImpact = "single_user" | "area" | "multiple_area" | "outage";
export type EscalationStatus = "pending" | "approved" | "rejected" | "resolved";

export interface TicketEscalation {
  id: string;
  ticketId: string;
  ticketDbId?: string;
  ticketTitle?: string;
  ticketStatus?: TicketStatus | string;
  createdBy: string;
  createdByName?: string | null;
  role: "NOC" | "LEADER" | "MANAGER" | string;
  type: EscalationType;
  severity: EscalationSeverity;
  impact: EscalationImpact;
  requiresImmediateAction: boolean;
  description: string;
  status: EscalationStatus;
  handledBy?: string | null;
  handledByName?: string | null;
  handledAt?: string | null;
  createdAt: string;
}

export const TICKET_STATUS_ORDER: TicketStatus[] = [
  TICKET_STATUS.CREATED,
  TICKET_STATUS.ASSIGNED,
  TICKET_STATUS.MATERIAL_PREPARED,
  TICKET_STATUS.IN_PROGRESS,
  TICKET_STATUS.ESCALATED,
  TICKET_STATUS.COMPLETED,
  TICKET_STATUS.PENDING_MANAGER_REVIEW,
  TICKET_STATUS.CLOSED,
  TICKET_STATUS.CLOSED_WITH_LOSS
];

export interface Ticket {
  id: string;
  dbId?: string;
  title: string;
  description: string;
  areaId: string;
  ticketLatitude?: number;
  ticketLongitude?: number;
  validRadiusMeter?: number;
  problemType: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  leaderId?: string;
  technicianId?: string;
  technicians?: Array<{ id: string; name: string }>;
  createdBy: string;
  branch: string;
  assignee: string;
  status: TicketStatus;
  estimatedLossPercent: number;
  escalated: boolean;
  escalationReason: string;
  escalationStatus?: EscalationStatus | null;
  hasOpenEscalation?: boolean;
  escalations?: TicketEscalation[];
  createdAt: string;
  updatedAt: string;
}
