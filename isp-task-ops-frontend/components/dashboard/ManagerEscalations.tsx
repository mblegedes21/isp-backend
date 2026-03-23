"use client";

import { Card } from "@/components/ui/Card";

interface ManagerEscalationRow {
  id: string;
  area: string;
  technician: string;
  reason: string;
  time: string;
}

interface ManagerEscalationsProps {
  rows: ManagerEscalationRow[];
}

export function ManagerEscalations({ rows }: ManagerEscalationsProps) {
  return (
    <Card title="Escalation Monitoring">
      <div className="overflow-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-600">
              <th className="px-3 py-2">Ticket ID</th>
              <th className="px-3 py-2">Area</th>
              <th className="px-3 py-2">Teknisi</th>
              <th className="px-3 py-2">Alasan Eskalasi</th>
              <th className="px-3 py-2">Waktu</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100">
                  <td className="px-3 py-3 font-semibold">{row.id}</td>
                  <td className="px-3 py-3">{row.area}</td>
                  <td className="px-3 py-3">{row.technician}</td>
                  <td className="px-3 py-3">{row.reason}</td>
                  <td className="px-3 py-3">{row.time}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                  Tidak ada tiket eskalasi saat ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
