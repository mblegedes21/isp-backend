"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getBranches } from "@/lib/branches";
import { extractApiMessage } from "@/lib/api";
import { jenisGangguanList, prioritasList } from "@/lib/dashboard";
import { useAuthStore } from "@/store/useAuthStore";
import { useTicketStore } from "@/store/useTicketStore";

const schema = z.object({
  customerLocation: z.string().min(3, "Lokasi pelanggan wajib diisi"),
  issueType: z.string().min(1, "Jenis gangguan wajib dipilih"),
  description: z.string().min(8, "Deskripsi minimal 8 karakter"),
  priority: z.string().min(1, "Prioritas wajib dipilih"),
  branchId: z.string().min(1, "Cabang wajib dipilih"),
});

type FormData = z.infer<typeof schema>;

type BranchOption = {
  id: string;
  name: string;
  code?: string;
};

export default function MitraTicketsPage() {
  const user = useAuthStore((state) => state.user);
  const tickets = useTicketStore((state) => state.tickets);
  const fetchTickets = useTicketStore((state) => state.fetchTickets);
  const createTicket = useTicketStore((state) => state.createTicket);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerLocation: "",
      issueType: jenisGangguanList[0],
      description: "",
      priority: prioritasList[1],
      branchId: "",
    },
  });

  useEffect(() => {
    let mounted = true;

    const loadPage = async () => {
      try {
        const [branchRows] = await Promise.all([getBranches(), fetchTickets()]);
        if (!mounted) {
          return;
        }

        setBranches(branchRows);
        setMessage("");
      } catch (error) {
        if (!mounted) {
          return;
        }

        setMessage(extractApiMessage(error, "Data tiket gagal dimuat."));
      } finally {
        if (mounted) {
          setLoadingBranches(false);
          setLoadingTickets(false);
        }
      }
    };

    void loadPage();

    return () => {
      mounted = false;
    };
  }, [fetchTickets]);

  useEffect(() => {
    if (branches.length === 0) {
      return;
    }

    const currentValues = getValues();
    reset({
      customerLocation: currentValues.customerLocation || "",
      issueType: currentValues.issueType || jenisGangguanList[0],
      description: currentValues.description || "",
      priority: currentValues.priority || prioritasList[1],
      branchId: currentValues.branchId || user?.branchId || branches[0]?.id || "",
    });
  }, [branches, getValues, reset, user?.branchId]);

  const myTickets = useMemo(() => tickets.filter((ticket) => ticket.createdBy === user?.id), [tickets, user?.id]);

  const onSubmit = async (values: FormData) => {
    try {
      setMessage("");
      const selectedBranch = branches.find((branch) => branch.id === values.branchId);

      await createTicket({
        customerLocation: values.customerLocation,
        description: values.description,
        branch: selectedBranch?.name ?? values.branchId,
        issueType: values.issueType,
        priority: values.priority,
      });

      setModalOpen(false);
      setMessage("Tiket berhasil dibuat.");
      reset({
        customerLocation: "",
        issueType: jenisGangguanList[0],
        description: "",
        priority: prioritasList[1],
        branchId: values.branchId,
      });
      await fetchTickets();
    } catch (error) {
      setMessage(extractApiMessage(error, "Gagal membuat tiket."));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700/70">Tiket Mitra</p>
          <h1 className="text-3xl font-bold text-slate-950">Kelola tiket pelanggan Anda</h1>
          <p className="mt-2 text-sm text-slate-600">Satu halaman untuk melihat daftar tiket dan membuat tiket baru tanpa pindah menu.</p>
        </div>
        <Button type="button" onClick={() => setModalOpen(true)} disabled={loadingBranches}>
          Buat Tiket
        </Button>
      </div>

      {message ? <p className="text-sm text-danger">{message}</p> : null}

      <Card title="Daftar Tiket Saya">
        {loadingTickets ? (
          <p className="text-sm text-slate-500">Memuat tiket...</p>
        ) : myTickets.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada tiket dari akun MITRA ini.</p>
        ) : (
          <div className="space-y-3">
            {myTickets.map((ticket) => (
              <div key={ticket.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-slate-900">{ticket.title || ticket.id}</p>
                    <p className="text-sm text-slate-600">{ticket.description || "Tanpa deskripsi tambahan."}</p>
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                      {ticket.problemType} - {ticket.branch} - {ticket.priority}
                    </p>
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

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700/70">Buat Tiket</p>
                <h2 className="text-2xl font-bold text-slate-950">Form tiket baru pelanggan</h2>
              </div>
              <button type="button" className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600" onClick={() => setModalOpen(false)}>
                Tutup
              </button>
            </div>

            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-800">Lokasi Pelanggan</label>
                <input {...register("customerLocation")} className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
                {errors.customerLocation ? <p className="mt-1 text-xs text-danger">{errors.customerLocation.message}</p> : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-800">Jenis Gangguan</label>
                <select {...register("issueType")} className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100">
                  {jenisGangguanList.map((jenis) => (
                    <option key={jenis} value={jenis}>
                      {jenis}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-800">Prioritas</label>
                <select {...register("priority")} className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100">
                  {prioritasList.map((prioritas) => (
                    <option key={prioritas} value={prioritas}>
                      {prioritas}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-800">Cabang</label>
                <select {...register("branchId")} className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100">
                  {branches.length === 0 ? <option value="">Tidak ada cabang</option> : null}
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                {errors.branchId ? <p className="mt-1 text-xs text-danger">{errors.branchId.message}</p> : null}
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-800">Deskripsi Masalah</label>
                <textarea {...register("description")} rows={4} className="w-full rounded-xl border border-slate-200 p-3 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
                {errors.description ? <p className="mt-1 text-xs text-danger">{errors.description.message}</p> : null}
              </div>

              <div className="md:col-span-2 flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting || branches.length === 0}>
                  {isSubmitting ? "Menyimpan..." : "Simpan Tiket"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
