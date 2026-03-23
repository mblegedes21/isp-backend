"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { apiClient, extractApiMessage } from "@/lib/api";

type MitraRow = {
  id: string;
  name: string;
  email: string;
  status: string;
  total_customers: number;
  total_omset: number;
};

type Summary = {
  total_mitra: number;
  total_omset: number;
  total_ppn: number;
  total_bhp_uso: number;
};

type MitraResponse = {
  data?: MitraRow[];
};

type SummaryResponse = {
  data?: Summary;
};

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function ManagerMitraPage() {
  const [rows, setRows] = useState<MitraRow[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total_mitra: 0,
    total_omset: 0,
    total_ppn: 0,
    total_bhp_uso: 0,
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadRows = async () => {
      try {
        const [summaryResponse, rowsResponse] = await Promise.all([
          apiClient.get<SummaryResponse>("/manager/mitra/summary"),
          apiClient.get<MitraResponse>("/manager/mitra"),
        ]);

        setSummary(
          summaryResponse.data?.data ?? {
            total_mitra: 0,
            total_omset: 0,
            total_ppn: 0,
            total_bhp_uso: 0,
          }
        );
        setRows(Array.isArray(rowsResponse.data?.data) ? rowsResponse.data.data : []);
        setMessage("");
      } catch (error) {
        setMessage(extractApiMessage(error, "Monitoring mitra gagal dimuat."));
      } finally {
        setLoading(false);
      }
    };

    void loadRows();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700/70">Mitra Monitoring</p>
        <h1 className="text-3xl font-bold text-slate-950">Pantau performa seluruh mitra</h1>
        <p className="mt-2 text-sm text-slate-600">Lihat koneksi reseller, jumlah pelanggan, omset, dan komponen pajak untuk tindak lanjut bisnis.</p>
      </div>

      {message ? <p className="text-sm text-danger">{message}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm font-semibold text-slate-500">Jumlah Mitra</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{summary.total_mitra}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-500">Total Omset</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{currency.format(summary.total_omset)}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-500">Total PPN</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{currency.format(summary.total_ppn)}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-500">BHP + USO</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{currency.format(summary.total_bhp_uso)}</p>
        </Card>
      </div>

      <Card title="Daftar Mitra">
        {loading ? (
          <p className="text-sm text-slate-500">Memuat data mitra...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada data mitra untuk dimonitor.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[760px] divide-y divide-slate-200 bg-white">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  <th className="px-4 py-3">Nama Mitra</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Total Pelanggan</th>
                  <th className="px-4 py-3">Omset</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="text-sm text-slate-700 transition hover:bg-sky-50/70">
                    <td className="px-4 py-3 font-semibold text-slate-950">
                      <Link href={`/dashboard/manager/mitra/${row.id}`} className="text-primary underline-offset-2 hover:underline">
                        {row.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="px-4 py-3">{row.total_customers}</td>
                    <td className="px-4 py-3">{currency.format(row.total_omset)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-sky-700">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
