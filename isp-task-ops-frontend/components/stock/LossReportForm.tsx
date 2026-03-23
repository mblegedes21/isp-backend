"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useStockStore } from "@/store/useStockStore";
import { useTicketStore } from "@/store/useTicketStore";

const schema = z.object({
  ticketId: z.string().min(1),
  technicianId: z.string().min(1),
  itemId: z.string().min(1),
  quantityLost: z.coerce.number().positive(),
  lossPercent: z.coerce.number().min(0).max(100),
  note: z.string().min(3)
});

type FormData = z.infer<typeof schema>;

export function LossReportForm() {
  const items = useStockStore((state) => state.items);
  const submitLossReport = useStockStore((state) => state.submitLossReport);
  const tickets = useTicketStore((state) => state.tickets);
  const technicians = useTicketStore((state) => state.technicians);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ticketId: tickets[0]?.id,
      technicianId: technicians[0]?.id,
      itemId: items[0]?.id,
      quantityLost: 1,
      lossPercent: 0,
      note: ""
    }
  });

  const onSubmit = async (values: FormData) => {
    const technician = technicians.find((item) => item.id === values.technicianId);
    const item = items.find((stockItem) => stockItem.id === values.itemId);

    await submitLossReport({
      ...values,
      technicianName: technician?.name ?? "Teknisi Tidak Dikenal",
      area: item?.branch ?? "Area Tidak Diketahui"
    });
    reset();
  };

  return (
    <Card title="Laporan Loss">
      <form className="grid grid-cols-1 gap-2" onSubmit={handleSubmit(onSubmit)}>
        <select className="tap-target rounded-md border border-gray-300" {...register("ticketId")}>
          {tickets.map((ticket) => (
            <option key={ticket.id} value={ticket.id}>{ticket.id} - {ticket.title}</option>
          ))}
        </select>
        <select className="tap-target rounded-md border border-gray-300" {...register("technicianId")}>
          {technicians.map((technician) => (
            <option key={technician.id} value={technician.id}>{technician.name}</option>
          ))}
        </select>
        <select className="tap-target rounded-md border border-gray-300" {...register("itemId")}>
          {items.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        <input className="tap-target rounded-md border border-gray-300" type="number" step="1" {...register("quantityLost")} placeholder="Jumlah material hilang" />
        <input className="tap-target rounded-md border border-gray-300" type="number" step="0.1" {...register("lossPercent")} placeholder="Persentase loss" />
        <textarea className="rounded-md border border-gray-300 p-3" rows={3} {...register("note")} placeholder="Alasan atau catatan loss" />
        {(errors.ticketId || errors.technicianId || errors.itemId || errors.quantityLost || errors.lossPercent || errors.note) ? (
          <p className="text-xs text-danger">Data laporan loss belum valid.</p>
        ) : null}
        <Button type="submit">Kirim Laporan Loss</Button>
      </form>
    </Card>
  );
}
