"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { apiClient, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useTicketStore } from "@/store/useTicketStore";

type CustomerResponse = {
  data?: Array<{ id: string }>;
};

export default function MitraDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const fetchTickets = useTicketStore((state) => state.fetchTickets);
  const tickets = useTicketStore((state) => state.tickets);
  const [customerCount, setCustomerCount] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        await fetchTickets();
        const response = await apiClient.get<CustomerResponse>("/customers");
        const rows = Array.isArray(response.data?.data) ? response.data.data : [];
        setCustomerCount(rows.length);
        setMessage("");
      } catch (error) {
        setMessage(extractApiMessage(error, "Dashboard mitra gagal dimuat."));
      }
    };

    void loadDashboard();
  }, [fetchTickets]);

  const myTickets = useMemo(() => tickets.filter((ticket) => ticket.createdBy === user?.id), [tickets, user?.id]);
  const openTickets = myTickets.filter((ticket) => !["COMPLETED", "CLOSED", "CLOSED_WITH_LOSS"].includes(ticket.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700/70">Dashboard Mitra</p>
          <h1 className="text-3xl font-bold text-slate-950">Ringkasan operasional reseller</h1>
          <p className="mt-2 text-sm text-slate-600">Pantau pelanggan, tiket aktif, dan akses cepat ke aktivitas harian Anda.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/mitra/tickets" className="tap-target rounded-xl border border-primary/90 bg-gradient-to-r from-primary to-sky-500 px-4 py-3 font-semibold text-white shadow-sm shadow-primary/25 transition hover:from-blue-700 hover:to-sky-600">
            Kelola Tiket
          </Link>
          <Link href="/dashboard/mitra/customers" className="tap-target rounded-xl border border-primary/20 bg-white/90 px-4 py-3 font-semibold text-ink shadow-sm transition hover:border-primary/40 hover:bg-primary/5">
            Pelanggan Saya
          </Link>
        </div>
      </div>

      {message ? <p className="text-sm text-danger">{message}</p> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-semibold text-slate-500">Pelanggan Terdaftar</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{customerCount}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-500">Tiket Saya</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{myTickets.length}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-500">Tiket Aktif</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{openTickets}</p>
        </Card>
      </div>

      <Card title="Aktivitas Terbaru">
        {myTickets.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada tiket. Gunakan menu Tiket untuk membuat permintaan baru.</p>
        ) : (
          <div className="space-y-3">
            {myTickets.slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{ticket.title || ticket.id}</p>
                    <p className="text-sm text-slate-500">{ticket.problemType} - {ticket.branch}</p>
                  </div>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-sky-700">
                    {ticket.status.replaceAll("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
