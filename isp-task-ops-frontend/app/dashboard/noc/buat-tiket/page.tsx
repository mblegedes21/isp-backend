"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getBranches } from "@/lib/branches";
import { jenisGangguanList, prioritasList } from "@/lib/dashboard";
import { useTicketStore } from "@/store/useTicketStore";

const schema = z.object({
  lokasiPelanggan: z.string().min(3, "Lokasi pelanggan wajib diisi"),
  jenisGangguan: z.string().min(1, "Jenis gangguan wajib dipilih"),
  deskripsiMasalah: z.string().min(8, "Deskripsi minimal 8 karakter"),
  prioritas: z.string().min(1, "Prioritas wajib dipilih"),
  cabang: z.string().min(1, "Cabang wajib dipilih")
});

type FormData = z.infer<typeof schema>;

export default function NocBuatTiketPage() {
  const router = useRouter();
  const createTicket = useTicketStore((state) => state.createTicket);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [submitMessage, setSubmitMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      lokasiPelanggan: "",
      jenisGangguan: jenisGangguanList[0],
      deskripsiMasalah: "",
      prioritas: prioritasList[1],
      cabang: ""
    }
  });

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const rows = await getBranches();
        setBranches(rows);
        setSubmitMessage("");
      } catch {
        setBranches([]);
        setSubmitMessage("");
      }
    };

    void loadBranches();
  }, []);

  useEffect(() => {
    if (branches.length === 0) return;
    reset({
      lokasiPelanggan: "",
      jenisGangguan: jenisGangguanList[0],
      deskripsiMasalah: "",
      prioritas: prioritasList[1],
      cabang: branches[0]?.id ?? ""
    });
  }, [branches, reset]);

  const onSubmit = async (values: FormData) => {
    try {
      setSubmitMessage("");
      const selectedBranch = branches.find((branch) => branch.id === values.cabang);
      await createTicket({
        customerLocation: values.lokasiPelanggan,
        description: values.deskripsiMasalah,
        branch: selectedBranch?.name ?? values.cabang,
        issueType: values.jenisGangguan,
        priority: values.prioritas
      });
      setSubmitMessage("Tiket berhasil dibuat");
      reset({
        lokasiPelanggan: "",
        jenisGangguan: jenisGangguanList[0],
        deskripsiMasalah: "",
        prioritas: prioritasList[1],
        cabang: values.cabang
      });
      window.setTimeout(() => {
        router.push("/dashboard/noc/daftar-ticket");
      }, 700);
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : "Gagal membuat tiket.");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Buat Tiket</h1>
      <Card title="Form Tiket Baru">
        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-semibold">Lokasi Pelanggan</label>
            <input {...register("lokasiPelanggan")} className="tap-target w-full rounded-md border border-gray-300 bg-white" />
            {errors.lokasiPelanggan ? <p className="mt-1 text-xs text-danger">{errors.lokasiPelanggan.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Jenis Gangguan</label>
            <select {...register("jenisGangguan")} className="tap-target w-full rounded-md border border-gray-300 bg-white">
              {jenisGangguanList.map((jenis) => (
                <option key={jenis} value={jenis}>{jenis}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Prioritas</label>
            <select {...register("prioritas")} className="tap-target w-full rounded-md border border-gray-300 bg-white">
              {prioritasList.map((prioritas) => (
                <option key={prioritas} value={prioritas}>{prioritas}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Cabang</label>
            <select {...register("cabang")} className="tap-target w-full rounded-md border border-gray-300 bg-white">
              {branches.length === 0 ? <option value="">Tidak ada cabang</option> : null}
              {branches.map((cabang) => (
                <option key={cabang.id} value={cabang.id}>{cabang.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-semibold">Deskripsi Masalah</label>
            <textarea {...register("deskripsiMasalah")} rows={4} className="w-full rounded-md border border-gray-300 p-3" />
            {errors.deskripsiMasalah ? <p className="mt-1 text-xs text-danger">{errors.deskripsiMasalah.message}</p> : null}
          </div>

          <div className="md:col-span-2">
            <Button type="submit" disabled={isSubmitting || branches.length === 0}>{isSubmitting ? "Menyimpan..." : "Simpan Tiket"}</Button>
          </div>
        </form>
        {submitMessage ? <p className="mt-3 text-sm text-success">{submitMessage}</p> : null}
      </Card>
    </div>
  );
}
