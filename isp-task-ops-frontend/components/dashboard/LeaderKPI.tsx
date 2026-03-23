"use client";

import { StatCard } from "@/components/ui/StatCard";

interface LeaderKPIProps {
  ticketAktif: number;
  sedangDikerjakan: number;
  menungguReview: number;
  ticketEskalasi: number;
  teknisiAktif: number;
  materialPending: number;
}

export function LeaderKPI({
  ticketAktif,
  sedangDikerjakan,
  menungguReview,
  ticketEskalasi,
  teknisiAktif,
  materialPending
}: LeaderKPIProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <StatCard title="Ticket Aktif" value={ticketAktif} />
      <StatCard title="Sedang Dikerjakan" value={sedangDikerjakan} />
      <StatCard title="Menunggu Review" value={menungguReview} />
      <StatCard title="Ticket Eskalasi" value={ticketEskalasi} />
      <StatCard title="Teknisi Aktif" value={teknisiAktif} />
      <StatCard title="Material Pending" value={materialPending} />
    </div>
  );
}
