"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTicketStore } from "@/store/useTicketStore";

const statusLabel: Record<string, string> = {
  ASSIGNED: "Belum Dikerjakan",
  MATERIAL_PREPARED: "Belum Dikerjakan",
  IN_PROGRESS: "Sedang Dikerjakan",
  ESCALATED: "Belum Selesai",
  COMPLETED: "Selesai",
  PENDING_MANAGER_REVIEW: "Menunggu Review Leader",
  CLOSED: "Selesai",
  CLOSED_WITH_LOSS: "Selesai"
};

const pekerjaanLabel: Record<string, string> = {
  FIBER_BACKBONE_DOWN: "Perbaikan Fiber Backbone",
  OLT_FAILURE: "Perbaikan OLT",
  CUSTOMER_VIP: "Instalasi Pelanggan VIP"
};

export default function TechnicianTicketListPage() {
  const tickets = useTicketStore((state) => state.tickets);

  const myTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status !== "CREATED"),
    [tickets]
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold md:text-2xl">Ticket Saya</h1>

      <div className="grid grid-cols-1 gap-3">
        {myTickets.map((ticket) => (
          <Card key={ticket.id} className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Ticket ID</p>
              <p className="text-lg font-bold text-app-text">{ticket.id}</p>

              <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-gray-500">Area</p>
                  <p className="font-semibold">{ticket.branch}</p>
                </div>
                <div>
                  <p className="text-gray-500">Jenis Pekerjaan</p>
                  <p className="font-semibold">{pekerjaanLabel[ticket.problemType] ?? ticket.problemType}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-semibold">{statusLabel[ticket.status] ?? ticket.status}</p>
              </div>

              <Link href={`/dashboard/technician/tickets/${ticket.id}`}>
                <Button className="mt-2 w-full">Detail</Button>
              </Link>
            </div>
          </Card>
        ))}

        {myTickets.length === 0 ? (
          <Card>
            <p className="text-sm text-gray-600">Belum ada tiket untuk ditampilkan.</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
