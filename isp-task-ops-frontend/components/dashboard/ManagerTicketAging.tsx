"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface ManagerTicketAgingRow {
  id: string;
  area: string;
  technician: string;
  leader: string;
  duration: string;
  sla: string;
  priority: string;
  status: string;
  state: "AMAN" | "MENDEKATI_SLA" | "LEWAT_SLA";
}

interface ManagerTicketAgingProps {
  rows: ManagerTicketAgingRow[];
  technicians: Array<{ id: string; name: string }>;
  onEscalate: (ticketId: string) => void;
  onReassign: (ticketId: string, technicianId: string) => void;
  onSupport: (ticketId: string) => void;
  onContactLeader: (ticketId: string) => void;
}

const stateTone = {
  AMAN: "bg-green-100 text-green-800",
  MENDEKATI_SLA: "bg-amber-100 text-amber-800",
  LEWAT_SLA: "bg-red-100 text-red-800"
};

export function ManagerTicketAging({
  rows,
  technicians,
  onEscalate,
  onReassign,
  onSupport,
  onContactLeader
}: ManagerTicketAgingProps) {
  return (
    <Card title="Ticket Aging / SLA Control">
      <div className="overflow-auto">
        <table className="w-full min-w-[1240px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-600">
              <th className="px-3 py-2">Ticket ID</th>
              <th className="px-3 py-2">Area</th>
              <th className="px-3 py-2">Teknisi</th>
              <th className="px-3 py-2">Leader</th>
              <th className="px-3 py-2">Durasi</th>
              <th className="px-3 py-2">SLA</th>
              <th className="px-3 py-2">Prioritas</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100">
                  <td className="px-3 py-3 font-semibold">{row.id}</td>
                  <td className="px-3 py-3">{row.area}</td>
                  <td className="px-3 py-3">{row.technician}</td>
                  <td className="px-3 py-3">{row.leader}</td>
                  <td className="px-3 py-3">{row.duration}</td>
                  <td className="px-3 py-3">{row.sla}</td>
                  <td className="px-3 py-3">{row.priority}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${stateTone[row.state]}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button className="px-3 py-2 text-sm" onClick={() => onEscalate(row.id)}>Eskalasi Tiket</Button>
                      <select
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                        defaultValue=""
                        onChange={(event) => {
                          if (event.target.value) {
                            onReassign(row.id, event.target.value);
                            event.target.value = "";
                          }
                        }}
                      >
                        <option value="">Reassign Teknisi</option>
                        {technicians.map((technician) => (
                          <option key={technician.id} value={technician.id}>{technician.name}</option>
                        ))}
                      </select>
                      <Button variant="secondary" className="px-3 py-2 text-sm" onClick={() => onSupport(row.id)}>Kirim Tim Tambahan</Button>
                      <Button variant="secondary" className="px-3 py-2 text-sm" onClick={() => onContactLeader(row.id)}>Hubungi Leader</Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-gray-500">
                  Tidak ada tiket yang mendekati atau melewati SLA.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
