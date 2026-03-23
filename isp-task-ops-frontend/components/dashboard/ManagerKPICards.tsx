"use client";

import { StatCard } from "@/components/ui/StatCard";

interface ManagerKPICardsProps {
  totalTiketAktif: number;
  tiketSelesaiHariIni: number;
  tiketEskalasi: number;
  teknisiAktifHariIni: number;
  permintaanMaterialPending: number;
}

export function ManagerKPICards({
  totalTiketAktif,
  tiketSelesaiHariIni,
  tiketEskalasi,
  teknisiAktifHariIni,
  permintaanMaterialPending
}: ManagerKPICardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard title="Total Tiket Aktif" value={totalTiketAktif} subtitle="Semua tiket yang masih berjalan" />
      <StatCard title="Tiket Selesai Hari Ini" value={tiketSelesaiHariIni} subtitle="Untuk evaluasi operasional harian" />
      <StatCard title="Tiket Eskalasi" value={tiketEskalasi} subtitle="Perlu perhatian lebih cepat" />
      <StatCard title="Teknisi Aktif Hari Ini" value={teknisiAktifHariIni} subtitle="Sudah check-in dan siap kerja" />
      <StatCard title="Permintaan Material Pending" value={permintaanMaterialPending} subtitle="Belum selesai diproses" />
    </div>
  );
}
