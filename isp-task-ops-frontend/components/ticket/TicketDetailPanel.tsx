"use client";

import { useMemo, useState } from "react";
import { EscalationModal } from "@/components/escalation/EscalationModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { canEditTicket } from "@/lib/business-rules";
import { useTicketStore } from "@/store/useTicketStore";
import { TICKET_STATUS_ORDER, type Ticket } from "@/types/ticket";
import { TicketStatusBadge } from "@/components/ticket/TicketStatusBadge";

interface TicketDetailProps {
  ticket: Ticket;
  roleCanUpdate: boolean;
  roleCanEscalate: boolean;
}

export function TicketDetailPanel({ ticket, roleCanUpdate, roleCanEscalate }: TicketDetailProps) {
  const transitionStatus = useTicketStore((state) => state.transitionStatus);
  const fetchTicketEscalations = useTicketStore((state) => state.fetchTicketEscalations);
  const [message, setMessage] = useState("");
  const [showEscalationModal, setShowEscalationModal] = useState(false);

  const nextStatus = useMemo(() => {
    const idx = TICKET_STATUS_ORDER.indexOf(ticket.status);
    return TICKET_STATUS_ORDER[idx + 1];
  }, [ticket.status]);

  const closingBlocked = ticket.hasOpenEscalation && (nextStatus === "CLOSED" || nextStatus === "CLOSED_WITH_LOSS");
  const editable = canEditTicket(ticket.status);

  const onAdvance = async () => {
    if (!nextStatus) {
      return;
    }

    if (closingBlocked) {
      setMessage("Tiket tidak dapat ditutup karena masih ada escalation yang belum selesai.");
      return;
    }

    const result = await transitionStatus(ticket.id, nextStatus);
    setMessage(result.message);
  };

  const onOpenEscalation = () => {
    if (ticket.escalated) {
      setMessage("Ticket sedang dalam escalation.");
      return;
    }

    setShowEscalationModal(true);
    setMessage("");
  };

  return (
    <>
      <Card title={`Ticket ${ticket.id}`}>
        <div className="space-y-2 text-sm">
          <p><strong>Title:</strong> {ticket.title}</p>
          <p><strong>Branch:</strong> {ticket.branch}</p>
          <p><strong>Assignee:</strong> {ticket.assignee}</p>
          <p><strong>Status:</strong> <TicketStatusBadge status={ticket.status} /></p>
          {ticket.hasOpenEscalation ? <p className="font-semibold text-danger">Ticket sedang dalam escalation.</p> : null}
          <p>
            <strong>Loss:</strong>
            <span className={ticket.estimatedLossPercent > 5 ? "ml-2 font-bold text-danger" : "ml-2"}>
              {ticket.estimatedLossPercent}% {ticket.estimatedLossPercent > 5 ? "(RED FLAG)" : ""}
            </span>
          </p>

          {(ticket.escalations ?? []).length > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-900">Escalation History</p>
              <div className="mt-2 space-y-2">
                {(ticket.escalations ?? []).map((row) => (
                  <div key={row.id} className="text-xs text-amber-900">
                    <p className="font-semibold">{row.type.replaceAll("_", " ")} | {row.severity} | {row.status}</p>
                    <p>{row.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button onClick={onAdvance} disabled={!nextStatus || !editable || !roleCanUpdate || Boolean(closingBlocked)}>
            Advance to {nextStatus ?? "N/A"}
          </Button>
          <Button variant="secondary" onClick={onOpenEscalation} disabled={!roleCanEscalate || ticket.escalated}>
            {ticket.escalated ? "Escalated" : "Buat Escalation"}
          </Button>
        </div>

        {!editable ? <p className="mt-3 text-xs text-danger">Edit is disabled after status reaches IN_PROGRESS.</p> : null}
        {closingBlocked ? <p className="mt-3 text-xs text-danger">Close ticket dinonaktifkan sampai escalation berstatus resolved atau rejected.</p> : null}
        {message ? <p className="mt-3 text-sm text-gray-700">{message}</p> : null}
      </Card>

      <EscalationModal
        ticket={ticket}
        open={showEscalationModal}
        onClose={() => setShowEscalationModal(false)}
        onSuccess={() => {
          setMessage("Escalation berhasil dibuat.");
          void fetchTicketEscalations(ticket.id);
        }}
      />
    </>
  );
}
