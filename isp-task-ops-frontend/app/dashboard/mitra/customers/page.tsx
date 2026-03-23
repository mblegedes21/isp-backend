"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient, extractApiMessage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const schema = z.object({
  name: z.string().min(3, "Nama wajib diisi"),
  nik: z.string().min(8, "NIK minimal 8 digit"),
  no_hp: z.string().min(8, "Nomor HP minimal 8 digit"),
  alamat: z.string().min(8, "Alamat wajib diisi"),
  latitude: z.string().min(1, "Latitude wajib diisi"),
  longitude: z.string().min(1, "Longitude wajib diisi"),
  package_name: z.string().min(2, "Nama paket wajib diisi"),
  package_price: z.string().min(1, "Harga paket wajib diisi"),
});

type FormData = z.infer<typeof schema>;

type Customer = {
  id: string;
  name: string;
  nik: string;
  no_hp: string;
  alamat: string;
  latitude: number;
  longitude: number;
  package_name: string;
  package_price: number;
  ppn: number;
  bhp: number;
  uso: number;
  total_price: number;
};

type DashboardSummary = {
  total_customers: number;
  total_omset: number;
  total_ppn: number;
  total_bhp_uso: number;
};

type CustomerResponse = {
  data?: Customer[];
};

type DashboardResponse = {
  data?: DashboardSummary;
};

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const emptySummary: DashboardSummary = {
  total_customers: 0,
  total_omset: 0,
  total_ppn: 0,
  total_bhp_uso: 0,
};

export default function MitraCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      nik: "",
      no_hp: "",
      alamat: "",
      latitude: "",
      longitude: "",
      package_name: "",
      package_price: "",
    },
  });

  const packagePrice = Number(watch("package_price") || 0);
  const billingPreview = useMemo(() => {
    const ppn = packagePrice * 0.11;
    const bhp = packagePrice * 0.005;
    const uso = packagePrice * 0.015;
    return {
      ppn,
      bhp,
      uso,
      total: packagePrice + ppn + bhp + uso,
    };
  }, [packagePrice]);

  const loadPageData = async () => {
    try {
      const [customerResponse, dashboardResponse] = await Promise.all([
        apiClient.get<CustomerResponse>("/customers"),
        apiClient.get<DashboardResponse>("/mitra/dashboard"),
      ]);

      setCustomers(Array.isArray(customerResponse.data?.data) ? customerResponse.data.data : []);
      setSummary(dashboardResponse.data?.data ?? emptySummary);
      setMessage("");
    } catch (error) {
      setMessage(extractApiMessage(error, "Data pelanggan gagal dimuat."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPageData();
  }, []);

  const openCreateModal = () => {
    setEditingCustomer(null);
    reset({
      name: "",
      nik: "",
      no_hp: "",
      alamat: "",
      latitude: "",
      longitude: "",
      package_name: "",
      package_price: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    reset({
      name: customer.name,
      nik: customer.nik,
      no_hp: customer.no_hp,
      alamat: customer.alamat,
      latitude: String(customer.latitude),
      longitude: String(customer.longitude),
      package_name: customer.package_name,
      package_price: String(customer.package_price),
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: FormData) => {
    try {
      const payload = {
        ...values,
        latitude: Number(values.latitude),
        longitude: Number(values.longitude),
        package_price: Number(values.package_price),
      };

      if (editingCustomer?.id) {
        await apiClient.put(`/customers/${editingCustomer.id}`, payload);
        setMessage("Pelanggan berhasil diperbarui.");
      } else {
        await apiClient.post("/customers", payload);
        setMessage("Pelanggan berhasil ditambahkan.");
      }

      setModalOpen(false);
      setEditingCustomer(null);
      reset();
      setLoading(true);
      await loadPageData();
    } catch (error) {
      setMessage(extractApiMessage(error, editingCustomer ? "Gagal memperbarui pelanggan." : "Gagal menambahkan pelanggan."));
    }
  };

  const onDelete = async (customer: Customer) => {
    const confirmed = window.confirm(`Hapus pelanggan ${customer.name}?`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(customer.id);
      await apiClient.delete(`/customers/${customer.id}`);
      setMessage("Pelanggan berhasil dihapus.");
      setLoading(true);
      await loadPageData();
    } catch (error) {
      setMessage(extractApiMessage(error, "Gagal menghapus pelanggan."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700/70">Pelanggan Saya</p>
          <h1 className="text-3xl font-bold text-slate-950">Kelola data pelanggan reseller</h1>
          <p className="mt-2 text-sm text-slate-600">Pantau omset, pajak, dan daftar pelanggan aktif dari satu halaman kerja.</p>
        </div>
        <Button type="button" onClick={openCreateModal}>
          Tambah Pelanggan
        </Button>
      </div>

      {message ? <p className="text-sm text-danger">{message}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm font-semibold text-slate-500">Total Pelanggan</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{summary.total_customers}</p>
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
          <p className="text-sm font-semibold text-slate-500">Total BHP + USO</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{currency.format(summary.total_bhp_uso)}</p>
        </Card>
      </div>

      <Card title="Daftar Pelanggan">
        {loading ? (
          <p className="text-sm text-slate-500">Memuat pelanggan...</p>
        ) : customers.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada pelanggan terdaftar untuk akun MITRA ini.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[1140px] divide-y divide-slate-200 bg-white">
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
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((customer) => (
                  <tr key={customer.id} className="align-top text-sm text-slate-700">
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button" className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950" onClick={() => setDetailCustomer(customer)} title="Detail">
                          <Eye size={16} />
                        </button>
                        <button type="button" className="rounded-lg border border-slate-200 p-2 text-sky-700 transition hover:bg-sky-50" onClick={() => openEditModal(customer)} title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button type="button" className="rounded-lg border border-slate-200 p-2 text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => onDelete(customer)} disabled={deletingId === customer.id} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700/70">{editingCustomer ? "Edit Pelanggan" : "Tambah Pelanggan"}</p>
                <h2 className="text-2xl font-bold text-slate-950">{editingCustomer ? "Perbarui data pelanggan" : "Form pelanggan baru"}</h2>
              </div>
              <button type="button" className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600" onClick={() => setModalOpen(false)}>
                Tutup
              </button>
            </div>

            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-800">Nama</label>
                <input {...register("name")} className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
                {errors.name ? <p className="mt-1 text-xs text-danger">{errors.name.message}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-800">NIK</label>
                <input {...register("nik")} className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
                {errors.nik ? <p className="mt-1 text-xs text-danger">{errors.nik.message}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-800">Nomor HP</label>
                <input {...register("no_hp")} className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
                {errors.no_hp ? <p className="mt-1 text-xs text-danger">{errors.no_hp.message}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-800">Nama Paket</label>
                <input {...register("package_name")} className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
                {errors.package_name ? <p className="mt-1 text-xs text-danger">{errors.package_name.message}</p> : null}
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-800">Alamat</label>
                <textarea {...register("alamat")} rows={3} className="w-full rounded-xl border border-slate-200 p-3 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
                {errors.alamat ? <p className="mt-1 text-xs text-danger">{errors.alamat.message}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-800">Latitude</label>
                <input {...register("latitude")} className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
                {errors.latitude ? <p className="mt-1 text-xs text-danger">{errors.latitude.message}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-800">Longitude</label>
                <input {...register("longitude")} className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
                {errors.longitude ? <p className="mt-1 text-xs text-danger">{errors.longitude.message}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-800">Harga Paket</label>
                <input {...register("package_price")} type="number" min="0" step="1000" className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
                {errors.package_price ? <p className="mt-1 text-xs text-danger">{errors.package_price.message}</p> : null}
              </div>

              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Simulasi Tagihan</p>
                <p className="mt-2">PPN 11%: {currency.format(billingPreview.ppn)}</p>
                <p>BHP 0.5%: {currency.format(billingPreview.bhp)}</p>
                <p>USO 1.5%: {currency.format(billingPreview.uso)}</p>
                <p className="mt-2 font-semibold text-slate-950">Total harga: {currency.format(billingPreview.total)}</p>
              </div>

              <div className="md:col-span-2 flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : editingCustomer ? "Update Pelanggan" : "Simpan Pelanggan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {detailCustomer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700/70">Detail Pelanggan</p>
                <h2 className="text-2xl font-bold text-slate-950">{detailCustomer.name}</h2>
              </div>
              <button type="button" className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600" onClick={() => setDetailCustomer(null)}>
                Tutup
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm font-semibold text-slate-500">NIK</p>
                <p className="mt-2 text-base font-semibold text-slate-950">{detailCustomer.nik}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm font-semibold text-slate-500">No HP</p>
                <p className="mt-2 text-base font-semibold text-slate-950">{detailCustomer.no_hp}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 md:col-span-2">
                <p className="text-sm font-semibold text-slate-500">Alamat</p>
                <p className="mt-2 text-base font-semibold text-slate-950">{detailCustomer.alamat}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm font-semibold text-slate-500">Koordinat</p>
                <p className="mt-2 text-base font-semibold text-slate-950">{detailCustomer.latitude}, {detailCustomer.longitude}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm font-semibold text-slate-500">Paket</p>
                <p className="mt-2 text-base font-semibold text-slate-950">{detailCustomer.package_name}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm font-semibold text-slate-500">Harga</p>
                <p className="mt-2 text-base font-semibold text-slate-950">{currency.format(detailCustomer.package_price)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm font-semibold text-slate-500">PPN</p>
                <p className="mt-2 text-base font-semibold text-slate-950">{currency.format(detailCustomer.ppn)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm font-semibold text-slate-500">BHP</p>
                <p className="mt-2 text-base font-semibold text-slate-950">{currency.format(detailCustomer.bhp)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm font-semibold text-slate-500">USO</p>
                <p className="mt-2 text-base font-semibold text-slate-950">{currency.format(detailCustomer.uso)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 md:col-span-2">
                <p className="text-sm font-semibold text-slate-500">Total</p>
                <p className="mt-2 text-xl font-bold text-slate-950">{currency.format(detailCustomer.total_price)}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
