"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { StockItem } from "@/types/stock";

interface RequestedMaterialInput {
  materialId: string;
  quantity: number;
}

interface MaterialSelectorProps {
  materials: StockItem[];
  selectedMaterials: RequestedMaterialInput[];
  onAddMaterial: (item: RequestedMaterialInput) => void;
}

export function MaterialSelector({ materials, selectedMaterials, onAddMaterial }: MaterialSelectorProps) {
  const defaultMaterialId = materials[0]?.id ?? "";
  const [materialId, setMaterialId] = useState(defaultMaterialId);
  const [quantity, setQuantity] = useState<number>(1);

  const selectedMaterial = useMemo(
    () => materials.find((item) => item.id === materialId),
    [materials, materialId]
  );

  const onSubmitMaterial = () => {
    if (!selectedMaterial) return;

    const maxAllowed = selectedMaterial.quantity;
    const qty = Math.max(1, Math.min(quantity, maxAllowed));

    onAddMaterial({
      materialId: selectedMaterial.id,
      quantity: qty
    });
    setQuantity(1);
  };

  const requestedIds = selectedMaterials.map((item) => item.materialId);
  const availableOptions = materials.filter((item) => !requestedIds.includes(item.id));

  useEffect(() => {
    if (availableOptions.length === 0) {
      setMaterialId("");
      return;
    }

    const isCurrentStillAvailable = availableOptions.some((item) => item.id === materialId);
    if (!isCurrentStillAvailable) {
      setMaterialId(availableOptions[0].id);
    }
  }, [availableOptions, materialId]);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-semibold">Pilih Material</label>
        <select
          className="tap-target w-full rounded-md border border-gray-300 bg-white"
          value={materialId}
          onChange={(event) => setMaterialId(event.target.value)}
          disabled={availableOptions.length === 0}
        >
          {availableOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.sku}) - Stok {item.quantity} {item.unit}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold">Jumlah</label>
        <input
          type="number"
          min={1}
          max={selectedMaterial?.quantity ?? 1}
          className="tap-target w-full rounded-md border border-gray-300 bg-white"
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
          disabled={!selectedMaterial}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold">Satuan</label>
        <div className="tap-target rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
          {selectedMaterial?.unit ?? "-"}
        </div>
      </div>

      <div className="md:col-span-4">
        <Button type="button" variant="secondary" onClick={onSubmitMaterial} disabled={!selectedMaterial || availableOptions.length === 0}>
          Tambah Material
        </Button>
      </div>
    </div>
  );
}
