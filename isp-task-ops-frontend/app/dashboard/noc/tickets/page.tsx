"use client";

import { useEffect, useState } from "react";
import { TicketTable } from "@/components/ticket/TicketTable";
import { useTicketStore } from "@/store/useTicketStore";

export default function NocTicketsPage() {
  const fetchTickets = useTicketStore((state) => state.fetchTickets);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetchTickets().catch((error) => {
      setMessage(error instanceof Error ? error.message : "Ticket list gagal dimuat.");
    });
  }, [fetchTickets]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Ticketing Module</h1>
      {message ? <p className="text-sm text-danger">{message}</p> : null}
      <TicketTable />
    </div>
  );
}
