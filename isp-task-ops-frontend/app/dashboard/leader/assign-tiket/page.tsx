"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { useTicketStore } from "@/store/useTicketStore";
import { statusTiketLabel } from "@/lib/dashboard";

const schema = z.object({
  teknisi: z.string().min(1, "Pilih teknisi"),
  material: z.string().min(3, "Tambah material minimal 3 karakter")
});

type FormData = z.infer<typeof schema>;

const teknisiList = ["Rizky", "Dina", "Ardi", "Bagas"];

export default function LeaderAssignTiketPage() {
  const tickets = useTicketStore((state) => state.tickets);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitSuccessful }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      teknisi: teknisiList[0],
      material: ""
    }
  });

  const onSubmit = (_values: FormData) => {
    reset({ teknisi: teknisiList[0], material: "" });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Assign Tiket</h1>

      <Card title="Antrian Tiket">
        <Table
          data={tickets}
          columns={[
            { header: "Nomor Tiket", key: "id", render: (row) => <span className="font-semibold">{row.id}</span> },
            { header: "Lokasi", key: "lokasi", render: (row) => row.branch },
            { header: "Jenis Gangguan", key: "jenis", render: (row) => row.title },
            { header: "Status", key: "status", render: (row) => statusTiketLabel[row.status] ?? row.status }
          ]}
        />
      </Card>

      <Card title="Form Penugasan">
        <form className="grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-1 block text-sm font-semibold">Pilih Teknisi</label>
            <select {...register("teknisi")} className="tap-target w-full rounded-md border border-gray-300 bg-white">
              {teknisiList.map((teknisi) => (
                <option key={teknisi} value={teknisi}>{teknisi}</option>
              ))}
            </select>
            {errors.teknisi ? <p className="mt-1 text-xs text-danger">{errors.teknisi.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Tambah Material</label>
            <input {...register("material")} className="tap-target w-full rounded-md border border-gray-300 bg-white" placeholder="Contoh: ONU Router 2 unit" />
            {errors.material ? <p className="mt-1 text-xs text-danger">{errors.material.message}</p> : null}
          </div>

          <div className="sm:col-span-2">
            <Button type="submit">Tugaskan Teknisi</Button>
          </div>
        </form>
        {isSubmitSuccessful ? <p className="mt-3 text-sm text-success">Penugasan berhasil disimpan (mock).</p> : null}
      </Card>
    </div>
  );
}
