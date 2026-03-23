"use client";

import { Card } from "@/components/ui/Card";

interface ManagerTechnicianWorkloadRow {
  id: string;
  name: string;
  area: string;
  activeTickets: number;
  completedToday: number;
  status: string;
}

interface ManagerTechnicianWorkloadProps {
  rows: ManagerTechnicianWorkloadRow[];
}

export function ManagerTechnicianWorkload({ rows }: ManagerTechnicianWorkloadProps) {
  return (
    <Card title="Beban Kerja Teknisi">
      {rows.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-app-text">{row.name}</h3>
                  <p className="text-sm text-gray-500">{row.area}</p>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                  {row.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Tiket Aktif</p>
                  <p className="mt-1 text-2xl font-bold text-app-text">{row.activeTickets}</p>
                </div>
                <div className="rounded-md bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Selesai Hari Ini</p>
                  <p className="mt-1 text-2xl font-bold text-app-text">{row.completedToday}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Belum ada data workload teknisi.</p>
      )}
    </Card>
  );
}
