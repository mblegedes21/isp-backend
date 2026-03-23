"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";

interface TechnicianSelectorProps {
  technicians: Array<{ id: string; name: string }>;
  selectedTechnicians: string[];
  onAddTechnician: (technicianId: string) => { ok: boolean; message?: string };
  onRemoveTechnician: (technicianId: string) => void;
}

export function TechnicianSelector({
  technicians,
  selectedTechnicians,
  onAddTechnician,
  onRemoveTechnician
}: TechnicianSelectorProps) {
  const availableTechnicians = useMemo(
    () => technicians.filter((technician) => !selectedTechnicians.includes(technician.id)),
    [technicians, selectedTechnicians]
  );

  const [selectedValue, setSelectedValue] = useState<string>(availableTechnicians[0]?.id ?? "");
  const [warning, setWarning] = useState<string>("");

  useEffect(() => {
    if (availableTechnicians.length === 0) {
      setSelectedValue("");
      return;
    }

    if (!availableTechnicians.some((technician) => technician.id === selectedValue)) {
      setSelectedValue(availableTechnicians[0].id);
    }
  }, [availableTechnicians, selectedValue]);

  const onTambahTeknisi = () => {
    if (!selectedValue) return;

    const result = onAddTechnician(selectedValue);
    setWarning(result.ok ? "" : result.message ?? "");
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
        <div>
          <label className="mb-1 block text-sm font-semibold">Pilih Teknisi</label>
          <select
            className="tap-target w-full rounded-md border border-gray-300 bg-white"
            value={selectedValue}
            onChange={(event) => setSelectedValue(event.target.value)}
            disabled={availableTechnicians.length === 0}
          >
            {availableTechnicians.map((teknisi) => (
              <option key={teknisi.id} value={teknisi.id}>{teknisi.name}</option>
            ))}
          </select>
        </div>

        <div className="self-end">
          <Button type="button" variant="secondary" onClick={onTambahTeknisi} disabled={!selectedValue}>
            Tambah Teknisi
          </Button>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold">Teknisi Terpilih:</p>
        {selectedTechnicians.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {selectedTechnicians.map((name) => (
              <li key={name} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
                <span>{technicians.find((technician) => technician.id === name)?.name ?? name}</span>
                <Button type="button" variant="danger" onClick={() => onRemoveTechnician(name)}>
                  Hapus
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-gray-600">Belum ada teknisi dipilih.</p>
        )}
      </div>

      {warning ? <p className="text-sm text-danger">{warning}</p> : null}
      {selectedTechnicians.length > 5 ? (
        <p className="text-sm text-danger">Maksimal 5 teknisi per tiket.</p>
      ) : null}
    </div>
  );
}
