import { Badge } from "@/components/ui/Badge";
import type { TicketStatus } from "@/types/ticket";

const toneMap: Record<TicketStatus, "neutral" | "warning" | "danger" | "success"> = {
  CREATED: "neutral",
  ASSIGNED: "warning",
  MATERIAL_PREPARED: "warning",
  IN_PROGRESS: "warning",
  ESCALATED: "danger",
  COMPLETED: "success",
  PENDING_MANAGER_REVIEW: "warning",
  CLOSED: "success",
  CLOSED_WITH_LOSS: "danger"
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return <Badge tone={toneMap[status]}>{status}</Badge>;
}
