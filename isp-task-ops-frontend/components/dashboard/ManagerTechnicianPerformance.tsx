"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface ManagerTechnicianPerformanceRow {
  id: string;
  name: string;
  activeTickets: number;
  completedToday: number;
  averageRepairHours: number;
  escalationCount: number;
  bonusEligibleJobs: number;
  installODP: number;
  repairFiber: number;
  replaceConnector: number;
  installONT: number;
  maintenance: number;
  total: number;
}

interface ManagerTechnicianPerformanceProps {
  rows: ManagerTechnicianPerformanceRow[];
  onAction: (technicianId: string, action: string) => void;
}

export function ManagerTechnicianPerformance({ rows, onAction }: ManagerTechnicianPerformanceProps) {
  return (
    <Card title="Technician Performance Control">
      <div className="overflow-auto">
        <table className="w-full min-w-[1420px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-600">
              <th className="px-3 py-2">Teknisi</th>
              <th className="px-3 py-2">Tiket Aktif</th>
              <th className="px-3 py-2">Tiket Selesai</th>
              <th className="px-3 py-2">Rata-rata Perbaikan</th>
              <th className="px-3 py-2">Jumlah Eskalasi</th>
              <th className="px-3 py-2">Install ODP</th>
              <th className="px-3 py-2">Repair Fiber</th>
              <th className="px-3 py-2">Replace Connector</th>
              <th className="px-3 py-2">Install ONT</th>
              <th className="px-3 py-2">Maintenance</th>
              <th className="px-3 py-2">Bonus Ready</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100">
                  <td className="px-3 py-3 font-semibold">{row.name}</td>
                  <td className="px-3 py-3">{row.activeTickets}</td>
                  <td className="px-3 py-3">{row.completedToday}</td>
                  <td className="px-3 py-3">{row.averageRepairHours.toFixed(1)} jam</td>
                  <td className="px-3 py-3">{row.escalationCount}</td>
                  <td className="px-3 py-3">{row.installODP}</td>
                  <td className="px-3 py-3">{row.repairFiber}</td>
                  <td className="px-3 py-3">{row.replaceConnector}</td>
                  <td className="px-3 py-3">{row.installONT}</td>
                  <td className="px-3 py-3">{row.maintenance}</td>
                  <td className="px-3 py-3">{row.bonusEligibleJobs}</td>
                  <td className="px-3 py-3 font-bold">{row.total}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" className="px-3 py-2 text-sm" onClick={() => onAction(row.id, "Review Performa")}>
                        Review Performa
                      </Button>
                      <Button variant="secondary" className="px-3 py-2 text-sm" onClick={() => onAction(row.id, "Kurangi Beban")}>
                        Kurangi Beban
                      </Button>
                      <Button className="px-3 py-2 text-sm" onClick={() => onAction(row.id, "Tugaskan Pekerjaan Prioritas")}>
                        Tugaskan Pekerjaan Prioritas
                      </Button>
                      <Button className="px-3 py-2 text-sm" onClick={() => onAction(row.id, "Approve Bonus")}>
                        Approve Bonus
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={13} className="px-3 py-8 text-center text-gray-500">
                  Statistik pekerjaan teknisi belum tersedia.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
