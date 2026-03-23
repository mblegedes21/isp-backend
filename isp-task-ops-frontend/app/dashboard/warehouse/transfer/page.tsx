"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useStockStore } from "@/store/useStockStore";
import { cabangList } from "@/lib/dashboard";

const schema = z.object({
  itemId: z.string().min(1, "Barang wajib dipilih"),
  fromBranch: z.string().min(1, "Dari cabang wajib dipilih"),
  toBranch: z.string().min(1, "Ke cabang wajib dipilih"),
  quantity: z.coerce.number().int().positive("Jumlah minimal 1")
});

type FormData = z.infer<typeof schema>;

export default function WarehouseTransferPage() {
  const items = useStockStore((state) => state.items);
  const requestTransfer = useStockStore((state) => state.requestTransfer);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitSuccessful }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      itemId: items[0]?.id ?? "",
      fromBranch: cabangList[0],
      toBranch: cabangList[1],
      quantity: 1
    }
  });

  const onSubmit = async (values: FormData) => {
    await requestTransfer(values);
    reset({
      itemId: items[0]?.id ?? "",
      fromBranch: cabangList[0],
      toBranch: cabangList[1],
      quantity: 1
    });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Transfer Barang</h1>
      <Card title="Form Transfer">
        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-1 block text-sm font-semibold">Barang</label>
            <select {...register("itemId")} className="tap-target w-full rounded-md border border-gray-300 bg-white">
              {items.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Dari Cabang</label>
            <select {...register("fromBranch")} className="tap-target w-full rounded-md border border-gray-300 bg-white">
              {cabangList.map((cabang) => (
                <option key={cabang} value={cabang}>{cabang}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Ke Cabang</label>
            <select {...register("toBranch")} className="tap-target w-full rounded-md border border-gray-300 bg-white">
              {cabangList.map((cabang) => (
                <option key={cabang} value={cabang}>{cabang}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Jumlah</label>
            <input type="number" min={1} {...register("quantity")} className="tap-target w-full rounded-md border border-gray-300 bg-white" />
            {errors.quantity ? <p className="mt-1 text-xs text-danger">{errors.quantity.message}</p> : null}
          </div>

          {(errors.itemId || errors.fromBranch || errors.toBranch) ? (
            <p className="text-xs text-danger md:col-span-2">Lengkapi seluruh field transfer barang.</p>
          ) : null}

          <div className="md:col-span-2">
            <Button type="submit">Simpan Transfer</Button>
          </div>
        </form>
        {isSubmitSuccessful ? <p className="mt-3 text-sm text-success">Transfer barang tersimpan (mock).</p> : null}
      </Card>
    </div>
  );
}
