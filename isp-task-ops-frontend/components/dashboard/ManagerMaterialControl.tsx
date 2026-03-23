"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface ManagerMaterialControlRow {
  materialId: string;
  material: string;
  area: string;
  technician: string;
  usageToday: number;
  usageWeek: number;
  averageUsage: number;
  status: "NORMAL" | "ABNORMAL";
  unit: string;
}

interface ManagerMaterialControlProps {
  rows: ManagerMaterialControlRow[];
  onAction: (materialId: string, action: string) => void;
}

export function ManagerMaterialControl({ rows, onAction }: ManagerMaterialControlProps) {
  const [areaFilter, setAreaFilter] = useState("SEMUA");
  const [materialFilter, setMaterialFilter] = useState("");

  const areas = useMemo(() => ["SEMUA", ...Array.from(new Set(rows.map((row) => row.area)))], [rows]);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const matchArea = areaFilter === "SEMUA" || row.area === areaFilter;
        const matchMaterial = !materialFilter.trim() || row.material.toLowerCase().includes(materialFilter.toLowerCase());
        return matchArea && matchMaterial;
      }),
    [areaFilter, materialFilter, rows]
  );

  return (
    <Card title="Material Usage Control">
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
          {areas.map((area) => <option key={area} value={area}>{area === "SEMUA" ? "Semua Area" : area}</option>)}
        </select>
        <input value={materialFilter} onChange={(event) => setMaterialFilter(event.target.value)} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" placeholder="Filter material" />
        <div className="rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500">
          Filter teknisi mengikuti tiket material aktif
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full min-w-[1180px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-600">
              <th className="px-3 py-2">Material</th>
              <th className="px-3 py-2">Area</th>
              <th className="px-3 py-2">Teknisi</th>
              <th className="px-3 py-2">Pemakaian Hari Ini</th>
              <th className="px-3 py-2">Pemakaian Minggu Ini</th>
              <th className="px-3 py-2">Rata-rata Pemakaian</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length > 0 ? (
              filteredRows.map((row) => (
                <tr key={`${row.materialId}-${row.area}`} className="border-b border-gray-100">
                  <td className="px-3 py-3 font-semibold">{row.material}</td>
                  <td className="px-3 py-3">{row.area}</td>
                  <td className="px-3 py-3">{row.technician}</td>
                  <td className="px-3 py-3">{row.usageToday} {row.unit}</td>
                  <td className="px-3 py-3">{row.usageWeek} {row.unit}</td>
                  <td className="px-3 py-3">{row.averageUsage.toFixed(1)} {row.unit}</td>
                  <td className="px-3 py-3">{row.status}</td>
                  <td className="px-3 py-3 text-right">
                    {row.status === "ABNORMAL" ? (
                      <div className="flex justify-end gap-2">
                        <Button className="px-3 py-2 text-sm" onClick={() => onAction(row.materialId, "Investigasi Pemakaian")}>Investigasi Pemakaian</Button>
                        <Button variant="secondary" className="px-3 py-2 text-sm" onClick={() => onAction(row.materialId, "Audit Gudang")}>Audit Gudang</Button>
                        <Button variant="secondary" className="px-3 py-2 text-sm" onClick={() => onAction(row.materialId, "Batasi Permintaan Material")}>Batasi Permintaan Material</Button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">Pemakaian masih normal</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                  Tidak ada material yang sesuai filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
