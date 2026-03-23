"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EscalationInbox } from "@/components/escalation/EscalationInbox";
import { Card } from "@/components/ui/Card";
import { ManagerKPICards } from "@/components/dashboard/ManagerKPICards";
import { mockAreaBaselines } from "@/lib/mock-data";
import { buildAreaMetrics } from "@/lib/manager-insights";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useManagerStore } from "@/store/useManagerStore";
import { useStockStore } from "@/store/useStockStore";
import { useTicketStore } from "@/store/useTicketStore";

const activeTicketStatuses = ["CREATED", "ASSIGNED", "MATERIAL_PREPARED", "IN_PROGRESS", "ESCALATED", "PENDING_MANAGER_REVIEW"];

const quickLinks = [
  {
    href: "/dashboard/manager/area-management",
    title: "Kontrol Area",
    description: "Pantau beban area dan ambil tindakan operasional untuk leader maupun teknisi."
  },
  {
    href: "/dashboard/manager/approval-loss",
    title: "Persetujuan Loss",
    description: "Review loss material, minta bukti tambahan, dan putuskan approval atau investigasi."
  },
  {
    href: "/dashboard/manager/audit-log",
    title: "Audit Log",
    description: "Telusuri perubahan penting dan tindak lanjuti aktivitas yang perlu klarifikasi."
  },
  {
    href: "/dashboard/manager/monitoring-area",
    title: "Monitoring Area",
    description: "Lihat kesehatan jaringan per area, indikasi insiden, dan dispatch tim network."
  },
  {
    href: "/dashboard/manager/attendance-flagged",
    title: "Absensi Flagged",
    description: "Tindak absensi bermasalah dengan peringatan, klarifikasi, dan notifikasi leader."
  }
];

export default function ManagerPage() {
  const tickets = useTicketStore((state) => state.tickets);
  const escalations = useTicketStore((state) => state.escalations);
  const fetchEscalations = useTicketStore((state) => state.fetchEscalations);
  const technicians = useTicketStore((state) => state.technicians);
  const losses = useStockStore((state) => state.losses);
  const ticketMaterialRequests = useStockStore((state) => state.ticketMaterialRequests);
  const getMaterialUsageToday = useStockStore((state) => state.getMaterialUsageToday);
  const getTodayRecords = useAttendanceStore((state) => state.getTodayRecords);
  const getFlaggedRecords = useAttendanceStore((state) => state.getFlaggedRecords);
  const incidents = useManagerStore((state) => state.incidents);
  const auditLogs = useManagerStore((state) => state.auditLogs);
  const areaActions = useManagerStore((state) => state.areaActions);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 250);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    void fetchEscalations().catch(() => undefined);
  }, [fetchEscalations]);

  const todayAttendance = getTodayRecords();
  const flaggedAttendance = getFlaggedRecords();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const materialUsageToday = getMaterialUsageToday();

  const areaMetrics = useMemo(
    () =>
      buildAreaMetrics({
        baselines: mockAreaBaselines,
        tickets,
        todayAttendance,
        ticketMaterialRequests,
        areaActions
      }),
    [areaActions, ticketMaterialRequests, tickets, todayAttendance]
  );

  const totalTiketAktif = tickets.filter((ticket) => activeTicketStatuses.includes(ticket.status)).length;
  const tiketSelesaiHariIni = tickets.filter((ticket) => {
    const done = ["COMPLETED", "CLOSED", "CLOSED_WITH_LOSS"].includes(ticket.status);
    return done && (ticket.updatedAt ?? ticket.createdAt ?? "").slice(0, 10) === today;
  }).length;
  const tiketEskalasi = tickets.filter((ticket) => ticket.escalated || ticket.status === "ESCALATED").length;
  const teknisiAktifHariIni = todayAttendance.filter((record) => Boolean(record.checkInAt)).length;
  const permintaanMaterialPending = ticketMaterialRequests.filter((request) => {
    const ticket = tickets.find((item) => item.id === request.ticketId);
    return ticket ? ["CREATED", "ASSIGNED", "MATERIAL_PREPARED"].includes(ticket.status) : false;
  }).length;

  const alerts = [
    areaMetrics.some((area) => area.status === "MERAH")
      ? {
          title: `${areaMetrics.filter((area) => area.status === "MERAH").length} area berstatus merah`,
          description: "Buka Monitoring Area untuk dispatch tim network atau eskalasi gangguan.",
          href: "/dashboard/manager/monitoring-area",
          tone: "border-red-200 bg-red-50 text-red-900"
        }
      : null,
    losses.some((loss) => loss.status === "MENUNGGU")
      ? {
          title: `${losses.filter((loss) => loss.status === "MENUNGGU").length} loss menunggu keputusan`,
          description: "Buka Persetujuan Loss untuk approval, reject, investigasi, atau minta bukti tambahan.",
          href: "/dashboard/manager/approval-loss",
          tone: "border-amber-200 bg-amber-50 text-amber-900"
        }
      : null,
    flaggedAttendance.length > 0
      ? {
          title: `${flaggedAttendance.length} absensi perlu tindak lanjut`,
          description: "Buka Absensi Flagged untuk peringatan, klarifikasi, dan review disiplin.",
          href: "/dashboard/manager/attendance-flagged",
          tone: "border-amber-200 bg-amber-50 text-amber-900"
        }
      : null,
    incidents.length > 0
      ? {
          title: `${incidents.length} indikasi insiden area`,
          description: "Buka Monitoring Area untuk deklarasi insiden dan koordinasi tim network.",
          href: "/dashboard/manager/monitoring-area",
          tone: "border-red-200 bg-red-50 text-red-900"
        }
      : null,
    auditLogs.length > 0
      ? {
          title: `${auditLogs.filter((log) => log.reviewStatus !== "SELESAI").length} audit log belum selesai ditinjau`,
          description: "Buka Audit Log untuk investigasi user, minta penjelasan, atau tandai selesai.",
          href: "/dashboard/manager/audit-log",
          tone: "border-sky-200 bg-sky-50 text-sky-900"
        }
      : null
  ].filter(Boolean) as Array<{ title: string; description: string; href: string; tone: string }>;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Dashboard Manajer</h1>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Manajer</h1>
        <p className="text-sm text-gray-600">Ringkasan operasional harian dan akses cepat ke modul kontrol manager.</p>
      </div>

      <ManagerKPICards
        totalTiketAktif={totalTiketAktif}
        tiketSelesaiHariIni={tiketSelesaiHariIni}
        tiketEskalasi={tiketEskalasi}
        teknisiAktifHariIni={teknisiAktifHariIni}
        permintaanMaterialPending={permintaanMaterialPending}
      />

      <Card title="Alert Operasional">
        {alerts.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {alerts.map((alert) => (
              <div key={`${alert.href}-${alert.title}`} className={`rounded-lg border p-4 ${alert.tone}`}>
                <h2 className="text-sm font-bold uppercase tracking-wide">{alert.title}</h2>
                <p className="mt-1 text-sm">{alert.description}</p>
                <Link
                  href={alert.href}
                  className="mt-3 inline-flex rounded-md bg-white/80 px-3 py-2 text-sm font-semibold text-gray-900 transition hover:bg-white"
                >
                  Buka Modul
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Tidak ada alert mendesak saat ini.</p>
        )}
      </Card>

      <EscalationInbox rows={escalations} title="Escalation Manager Queue" />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="Status Operasional Singkat">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Area Bermasalah</p>
              <p className="mt-2 text-3xl font-bold">{areaMetrics.filter((area) => area.status !== "HIJAU").length}</p>
              <p className="mt-1 text-sm text-gray-600">Lanjutkan ke Kontrol Area atau Monitoring Area untuk tindakan.</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Material Dipakai Hari Ini</p>
              <p className="mt-2 text-3xl font-bold">{materialUsageToday.reduce((sum, item) => sum + item.totalQuantity, 0)}</p>
              <p className="mt-1 text-sm text-gray-600">Pantau detail pemakaian dan lonjakan di modul terkait.</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Teknisi Terdaftar</p>
              <p className="mt-2 text-3xl font-bold">{technicians.length}</p>
              <p className="mt-1 text-sm text-gray-600">Gunakan Kontrol Area untuk penyesuaian beban tim lapangan.</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Audit Perlu Review</p>
              <p className="mt-2 text-3xl font-bold">{auditLogs.filter((log) => log.reviewStatus !== "SELESAI").length}</p>
              <p className="mt-1 text-sm text-gray-600">Buka Audit Log untuk akuntabilitas operasional.</p>
            </div>
          </div>
        </Card>

        <Card title="Tautan Cepat Modul">
          <div className="space-y-3">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-teal-300 hover:bg-teal-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">{item.title}</h2>
                    <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                  </div>
                  <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">Buka</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
