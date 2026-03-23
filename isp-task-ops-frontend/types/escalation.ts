export type EscalationReason =
  | "FIBER_BACKBONE_DOWN"
  | "OLT_FAILURE"
  | "VENDOR_REQUIRED"
  | "DIGGING_PERMISSION"
  | "CUSTOMER_VIP";

export interface Escalation {
  id: string;
  ticketId: string;
  reason: EscalationReason;
  note?: string;
  escalatedBy: string;
  createdAt: string;
}
