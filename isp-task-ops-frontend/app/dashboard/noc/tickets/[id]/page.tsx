"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TicketDetailPanel } from "@/components/ticket/TicketDetailPanel";
import { useTicketStore } from "@/store/useTicketStore";
import { useAuthStore } from "@/store/useAuthStore";
import { canRoleEscalate, canRoleUpdateTicket } from "@/lib/business-rules";

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const tickets = useTicketStore((state) => state.tickets);
  const fetchTicketById = useTicketStore((state) => state.fetchTicketById);
  const ticket = tickets.find((item) => item.id === params.id);
  const role = useAuthStore((state) => state.user?.role);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (ticket || !params.id) return;

    void fetchTicketById(params.id).catch((error) => {
      setMessage(error instanceof Error ? error.message : "Ticket gagal dimuat.");
    });
  }, [fetchTicketById, params.id, ticket]);

  if (!ticket) {
    return <p className="text-sm text-danger">{message || "Ticket not found."}</p>;
  }

  return (
    <div className="space-y-4">
      <Link className="text-sm font-semibold text-accent underline" href="/dashboard/noc/tickets">
        Back to ticket list
      </Link>
      <TicketDetailPanel
        ticket={ticket}
        roleCanUpdate={role ? canRoleUpdateTicket(role) : false}
        roleCanEscalate={role ? canRoleEscalate(role) : false}
      />
    </div>
  );
}
