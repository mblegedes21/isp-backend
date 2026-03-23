"use client";

import { TicketTabs } from "@/components/ticket/TicketTabs";

export default function LeaderTicketsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Manajemen Ticket</h1>
      <p className="text-sm text-gray-600">Kelola ticket baru, assignment teknisi, progress pekerjaan, dan review akhir dalam satu halaman.</p>
      <TicketTabs />
    </div>
  );
}
