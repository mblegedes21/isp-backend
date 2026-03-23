"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import type { TechnicianLocationLog } from "@/types/tracking";

interface ManagerTechnicianMapProps {
  rows: TechnicianLocationLog[];
}

const statusTone = {
  valid: "bg-emerald-500",
  warning: "bg-amber-500",
  suspicious: "bg-orange-500",
  rejected: "bg-red-600"
};

export function ManagerTechnicianMap({ rows }: ManagerTechnicianMapProps) {
  const bounds = useMemo(() => {
    const latitudes = rows.map((row) => row.latitude);
    const longitudes = rows.map((row) => row.longitude);

    return {
      minLat: Math.min(...latitudes, -7.1),
      maxLat: Math.max(...latitudes, -6.1),
      minLng: Math.min(...longitudes, 106.7),
      maxLng: Math.max(...longitudes, 107.1)
    };
  }, [rows]);

  const markers = useMemo(
    () =>
      rows.map((row) => {
        const left = ((row.longitude - bounds.minLng) / Math.max(bounds.maxLng - bounds.minLng, 0.0001)) * 100;
        const top = ((bounds.maxLat - row.latitude) / Math.max(bounds.maxLat - bounds.minLat, 0.0001)) * 100;
        return { ...row, left, top };
      }),
    [bounds, rows]
  );

  return (
    <Card title="Peta Monitoring Teknisi">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="relative h-[520px] overflow-hidden rounded-2xl border border-gray-200 bg-[radial-gradient(circle_at_top,#dbeafe,transparent_35%),linear-gradient(180deg,#eff6ff_0%,#ecfccb_100%)]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.16)_1px,transparent_1px)] bg-[size:64px_64px]" />
          <div className="absolute inset-6 rounded-[28px] border border-white/60" />

          {markers.map((marker) => (
            <div
              key={marker.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
              style={{ left: `${marker.left}%`, top: `${marker.top}%` }}
            >
              <div className="group relative">
                <div className={`h-4 w-4 rounded-full border-2 border-white shadow-lg ${statusTone[marker.locationStatus]}`} />
                <div className="pointer-events-none absolute left-1/2 top-6 hidden w-52 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-xl group-hover:block">
                  <p className="font-semibold text-gray-900">{marker.technicianName}</p>
                  <p className="mt-1 text-gray-600">{marker.branch} • {marker.area}</p>
                  <p className="mt-1 text-gray-600">Tiket aktif: {marker.ticketId ?? "Tidak ada"}</p>
                  <p className="mt-1 text-gray-600">Jarak ke tiket: {marker.calculatedDistanceMeter} m</p>
                  <p className="mt-1 text-gray-600">Status lokasi: {marker.locationStatus}</p>
                  <p className="mt-1 text-gray-600">Update: {new Date(marker.createdAt).toLocaleTimeString("id-ID")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{row.technicianName}</p>
                  <p className="text-sm text-gray-600">{row.branch} • {row.area}</p>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">{row.locationStatus}</span>
              </div>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>Tiket aktif: {row.ticketId ?? "Tidak ada"}</p>
                <p>Jarak ke tiket: {row.calculatedDistanceMeter} meter</p>
                <p>Akurasi GPS: {row.accuracy} meter</p>
                <p>Update terakhir: {new Date(row.createdAt).toLocaleTimeString("id-ID")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
