"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export interface ManagerTicketQueueRow {
  id: string;
  area: string;
  status: string;
  leader: string;
  technician: string;
  priority: string;
  statusTone: "neutral" | "warning" | "danger" | "success";
}

interface ManagerTicketQueueProps {
  rows: ManagerTicketQueueRow[];
  onAssign: (ticketId: string) => void;
}

type SortValue = "priority-desc" | "priority-asc" | "ticket-asc" | "area-asc";

const priorityRank: Record<string, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1
};

export function ManagerTicketQueue({ rows, onAssign }: ManagerTicketQueueProps) {
  const [statusFilter, setStatusFilter] = useState("SEMUA");
  const [areaFilter, setAreaFilter] = useState("SEMUA");
  const [sortBy, setSortBy] = useState<SortValue>("priority-desc");

  const areas = useMemo(
    () => ["SEMUA", ...Array.from(new Set(rows.map((row) => row.area)))],
    [rows]
  );

  const filteredRows = useMemo(() => {
    const nextRows = rows.filter((row) => {
      const matchStatus = statusFilter === "SEMUA" || row.status === statusFilter;
      const matchArea = areaFilter === "SEMUA" || row.area === areaFilter;
      return matchStatus && matchArea;
    });

    nextRows.sort((left, right) => {
      if (sortBy === "priority-desc") {
        return (priorityRank[right.priority] ?? 0) - (priorityRank[left.priority] ?? 0);
      }

      if (sortBy === "priority-asc") {
        return (priorityRank[left.priority] ?? 0) - (priorityRank[right.priority] ?? 0);
      }

      if (sortBy === "ticket-asc") {
        return left.id.localeCompare(right.id);
      }

      return left.area.localeCompare(right.area);
    });

    return nextRows;
  }, [areaFilter, rows, sortBy, statusFilter]);

  return (
    <Card title="Antrian Tiket Masuk">
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="space-y-1">
          <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Filter Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="SEMUA">Semua Status</option>
            <option value="CREATED">Created</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="MATERIAL_PREPARED">Material Prepared</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Filter Area</span>
          <select
            value={areaFilter}
            onChange={(event) => setAreaFilter(event.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            {areas.map((area) => (
              <option key={area} value={area}>
                {area === "SEMUA" ? "Semua Area" : area}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Urutkan</span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortValue)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="priority-desc">Prioritas Tertinggi</option>
            <option value="priority-asc">Prioritas Terendah</option>
            <option value="ticket-asc">Ticket ID</option>
            <option value="area-asc">Area</option>
          </select>
        </label>
      </div>

      <div className="overflow-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-600">
              <th className="px-3 py-2">Ticket ID</th>
              <th className="px-3 py-2">Area</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Leader</th>
              <th className="px-3 py-2">Teknisi</th>
              <th className="px-3 py-2">Prioritas</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length > 0 ? (
              filteredRows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100">
                  <td className="px-3 py-3 font-semibold">{row.id}</td>
                  <td className="px-3 py-3">{row.area}</td>
                  <td className="px-3 py-3">
                    <Badge tone={row.statusTone}>{row.status}</Badge>
                  </td>
                  <td className="px-3 py-3">{row.leader}</td>
                  <td className="px-3 py-3">{row.technician}</td>
                  <td className="px-3 py-3">{row.priority}</td>
                  <td className="px-3 py-3 text-right">
                    <Button onClick={() => onAssign(row.id)} className="px-4 py-2 text-sm">
                      Tugaskan
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                  Tidak ada tiket yang sesuai dengan filter saat ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
