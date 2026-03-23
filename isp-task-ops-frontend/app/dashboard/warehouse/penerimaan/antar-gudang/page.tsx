"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useStockStore } from "@/store/useStockStore";

export default function PenerimaanAntarGudangPage() {
  const items = useStockStore((state) => state.items);
  const [materialId, setMaterialId] = useState(items[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [gudangAsal, setGudangAsal] = useState("Gudang Bandung");
  const [info, setInfo] = useState("");

  const onMasukkan = () => {
    setInfo("Material berhasil dimasukkan ke stok gudang (mock).");
  };

  const onPrint = () => {
    setInfo("Laporan penerimaan antar gudang siap dicetak (mock).");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Penerimaan Barang - Antar Gudang</h1>
      <Card title="Form Penerimaan Antar Gudang">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold">Material</label>
            <select className="tap-target w-full rounded-md border border-gray-300 bg-white" value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
              {items.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Qty</label>
            <input type="number" min={1} className="tap-target w-full rounded-md border border-gray-300 bg-white" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-semibold">Gudang Asal</label>
            <input className="tap-target w-full rounded-md border border-gray-300 bg-white" value={gudangAsal} onChange={(e) => setGudangAsal(e.target.value)} />
          </div>
          <div className="md:col-span-2 flex flex-wrap gap-2">
            <Button type="button" onClick={onMasukkan}>Masukkan ke Stock Gudang</Button>
            <Button type="button" variant="secondary" onClick={onPrint}>Print Laporan</Button>
          </div>
        </div>
        {info ? <p className="mt-2 text-sm text-gray-700">{info}</p> : null}
      </Card>
    </div>
  );
}
