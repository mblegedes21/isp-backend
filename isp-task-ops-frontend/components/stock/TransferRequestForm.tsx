"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useStockStore } from "@/store/useStockStore";

const schema = z.object({
  itemId: z.string().min(1),
  fromBranch: z.string().min(2),
  toBranch: z.string().min(2),
  quantity: z.coerce.number().int().positive()
});

type FormData = z.infer<typeof schema>;

export function TransferRequestForm() {
  const items = useStockStore((state) => state.items);
  const requestTransfer = useStockStore((state) => state.requestTransfer);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      itemId: items[0]?.id,
      fromBranch: "",
      toBranch: "",
      quantity: 1
    }
  });

  const onSubmit = async (values: FormData) => {
    await requestTransfer(values);
    reset();
  };

  return (
    <Card title="Transfer Request">
      <form className="grid grid-cols-1 gap-2" onSubmit={handleSubmit(onSubmit)}>
        <select className="tap-target rounded-md border border-gray-300" {...register("itemId")}>
          {items.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        <input className="tap-target rounded-md border border-gray-300" placeholder="From Branch" {...register("fromBranch")} />
        <input className="tap-target rounded-md border border-gray-300" placeholder="To Branch" {...register("toBranch")} />
        <input className="tap-target rounded-md border border-gray-300" type="number" min={1} {...register("quantity")} />
        {(errors.itemId || errors.fromBranch || errors.toBranch || errors.quantity) ? (
          <p className="text-xs text-danger">Please complete all transfer fields with valid values.</p>
        ) : null}
        <Button type="submit">Submit Request</Button>
      </form>
    </Card>
  );
}
