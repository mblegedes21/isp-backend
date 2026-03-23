"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { apiClient, extractApiMessage } from "@/lib/api";

type Customer = {
  id: string;
  name: string;
  nik: string;
  no_hp: string;
  alamat: string;
  package_name: string;
  package_price: number;
  ppn: number;
  bhp: number;
  uso: number;
  total_price: number;
};

type MitraDetail = {
  id: string;
  name: string;
  email: string;
  total_customers: number;
  total_omset: number;
  total_ppn: number;
  total_bhp: number;
  total_uso: number;
  customers: Customer[];
};

type MitraDetailResponse = {
  data?: MitraDetail;
};

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function ManagerMitraDetailPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<MitraDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadDetail = async () => {
      try {
        const response = await apiClient.get<MitraDetailResponse>(`/manager/mitra/${params.id}`);
        setDetail(response.data?.data ?? null);
        setMessage("");
      } catch (error) {
        setMessage(extractApiMessage(error, "Detail mitra gagal dimuat."));
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      void loadDetail();
    }
  }, [params.id]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700/70">Detail Mitra</p>
        <h1 className="text-3xl font-bold text-slate-950">{detail?.name ?? "Monitoring detail mitra"}</h1>
        <p className="mt-2 text-sm text-slate-600">{detail?.email ?? "Ringkasan pelanggan, omset, dan komponen pajak mitra."}</p>
      </div>

      {message ? <p className="text-sm text-danger">{message}</p> : null}

      {loading ? (
        <Card title="Memuat">
          <p className="text-sm text-slate-500">Mengambil detail mitra...</p>
        </Card>
      ) : detail ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <p className="text-sm font-semibold text-slate-500">Total Pelanggan</p>
              <p className="mt-3 text-3xl font-bold text-slate-950">{detail.total_customers}</p>
            </Card>
            <Card>
              <p className="text-sm font-semibold text-slate-500">Omset</p>
              <p className="mt-3 text-3xl font-bold text-slate-950">{currency.format(detail.total_omset)}</p>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <p className="text-sm font-semibold text-slate-500">PPN</p>
              <p className="mt-3 text-3xl font-bold text-slate-950">{currency.format(detail.total_ppn)}</p>
            </Card>
            <Card>
              <p className="text-sm font-semibold text-slate-500">BHP</p>
              <p className="mt-3 text-3xl font-bold text-slate-950">{currency.format(detail.total_bhp)}</p>
            </Card>
            <Card>
              <p className="text-sm font-semibold text-slate-500">USO</p>
              <p className="mt-3 text-3xl font-bold text-slate-950">{currency.format(detail.total_uso)}</p>
            </Card>
          </div>

          <Card title="List Pelanggan">
            {detail.customers.length === 0 ? (
              <p className="text-sm text-slate-500">Mitra ini belum memiliki pelanggan.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-[1080px] w-full divide-y divide-slate-200 bg-white">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">NIK</th>
                      <th className="px-4 py-3">No HP</th>
                      <th className="px-4 py-3">Alamat</th>
                      <th className="px-4 py-3">Paket</th>
                      <th className="px-4 py-3">Harga</th>
                      <th className="px-4 py-3">PPN</th>
                      <th className="px-4 py-3">BHP</th>
                      <th className="px-4 py-3">USO</th>
                      <th className="px-4 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detail.customers.map((customer) => (
                      <tr key={customer.id} className="text-sm text-slate-700">
                        <td className="px-4 py-3 font-semibold text-slate-950">{customer.name}</td>
                        <td className="px-4 py-3">{customer.nik}</td>
                        <td className="px-4 py-3">{customer.no_hp}</td>
                        <td className="px-4 py-3">{customer.alamat}</td>
                        <td className="px-4 py-3">{customer.package_name}</td>
                        <td className="px-4 py-3">{currency.format(customer.package_price)}</td>
                        <td className="px-4 py-3">{currency.format(customer.ppn)}</td>
                        <td className="px-4 py-3">{currency.format(customer.bhp)}</td>
                        <td className="px-4 py-3">{currency.format(customer.uso)}</td>
                        <td className="px-4 py-3 font-semibold text-slate-950">{currency.format(customer.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      ) : (
        <Card title="Tidak Ada Data">
          <p className="text-sm text-slate-500">Detail mitra tidak ditemukan.</p>
        </Card>
      )}
    </div>
  );
}
