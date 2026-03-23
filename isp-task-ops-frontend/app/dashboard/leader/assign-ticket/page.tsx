"use client";

import { AssignTicketForm } from "@/components/ticket/AssignTicketForm";

export default function LeaderAssignTicketPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tugaskan Tiket</h1>
      <p className="text-sm text-gray-600">Pilih 1-5 teknisi, tambahkan material, lalu kirim request ke gudang.</p>
      <AssignTicketForm />
    </div>
  );
}
