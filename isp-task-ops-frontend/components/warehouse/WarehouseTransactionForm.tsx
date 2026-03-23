"use client";

import { type FormEvent, type ReactNode, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import type { StockItem } from "@/types/stock";

interface WarehouseTransactionFormProps {
  title: string;
  items: StockItem[];
  materialId: string;
  quantity: number;
  unitPrice: number;
  description: string;
  descriptionPlaceholder?: string;
  onMaterialChange: (value: string) => void;
  onQuantityChange: (value: number) => void;
  onUnitPriceChange: (value: number) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => void;
  submitLabel: string;
  submitting?: boolean;
  showPricing?: boolean;
  additionalFields?: ReactNode;
}

export function WarehouseTransactionForm({
  title,
  items,
  materialId,
  quantity,
  unitPrice,
  description,
  descriptionPlaceholder,
  onMaterialChange,
  onQuantityChange,
  onUnitPriceChange,
  onDescriptionChange,
  onSubmit,
  submitLabel,
  submitting = false,
  showPricing = true,
  additionalFields
}: WarehouseTransactionFormProps) {
  const selectedMaterial = useMemo(
    () => items.find((item) => item.id === materialId) ?? null,
    [items, materialId]
  );

  const totalPrice = quantity * unitPrice;
  const baseInputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900";
  const readOnlyInputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700";

  return (
    <form
      className="ml-0 mr-auto w-full max-w-[1100px] space-y-4"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="mb-[14px] space-y-1">
          <span className="text-sm font-semibold text-slate-900">Material</span>
          <select className={`tap-target ${baseInputClass}`} value={materialId} onChange={(event) => onMaterialChange(event.target.value)}>
            {items.map((item) => (
              <option key={item.id} value={item.id}>{item.materialName ?? item.name}</option>
            ))}
          </select>
        </label>

        <label className="mb-[14px] space-y-1">
          <span className="text-sm font-semibold text-slate-900">Category</span>
          <input className={readOnlyInputClass} value={selectedMaterial?.category ?? ""} readOnly />
        </label>

        <label className="mb-[14px] space-y-1">
          <span className="text-sm font-semibold text-slate-900">Brand</span>
          <input className={readOnlyInputClass} value={selectedMaterial?.brand ?? ""} readOnly />
        </label>

        <label className="mb-[14px] space-y-1">
          <span className="text-sm font-semibold text-slate-900">Unit</span>
          <input className={readOnlyInputClass} value={selectedMaterial?.unit ?? ""} readOnly />
        </label>

        <label className="mb-[14px] space-y-1">
          <span className="text-sm font-semibold text-slate-900">Quantity</span>
          <input type="number" min={1} className={`tap-target ${baseInputClass}`} value={quantity} onChange={(event) => onQuantityChange(Number(event.target.value))} />
        </label>

        {showPricing ? (
          <>
            <label className="mb-[14px] space-y-1">
              <span className="text-sm font-semibold text-slate-900">Unit Price</span>
              <input type="number" min={0} className={`tap-target ${baseInputClass}`} value={unitPrice} onChange={(event) => onUnitPriceChange(Number(event.target.value))} />
            </label>

            <label className="mb-[14px] space-y-1">
              <span className="text-sm font-semibold text-slate-900">Total Price</span>
              <input className={readOnlyInputClass} value={`Rp ${totalPrice.toLocaleString("id-ID")}`} readOnly />
            </label>
          </>
        ) : null}

        {additionalFields}

        <label className="mb-[14px] md:col-span-2">
          <span className="mb-[6px] block text-sm font-semibold text-slate-900">Description</span>
          <textarea
            rows={4}
            className="block min-h-[90px] w-full resize-y rounded-lg border border-[#d1d5db] bg-white px-[10px] py-[10px] text-sm text-slate-900"
            placeholder={descriptionPlaceholder ?? "Contoh: Catatan tambahan mengenai kondisi material atau transaksi gudang."}
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
          />
        </label>
      </div>

      <Button type="submit" className="px-4 py-2 text-sm" disabled={submitting}>
        {submitting ? "Menyimpan..." : submitLabel}
      </Button>
    </form>
  );
}
