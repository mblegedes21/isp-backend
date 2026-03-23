"use client";

import { useMemo, useState } from "react";
import { Check, FileSearch, Files, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { ManagementTable, type ManagementTableColumn } from "@/components/ui/ManagementTable";
import type { LossReport } from "@/types/stock";

interface ManagerLossApprovalProps {
  losses: LossReport[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onInvestigate: (id: string) => void;
  onRequestEvidence: (id: string) => void;
}

export function ManagerLossApproval({ losses, onApprove, onReject, onInvestigate, onRequestEvidence }: ManagerLossApprovalProps) {
  const [statusFilter, setStatusFilter] = useState("SEMUA");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filteredLosses = useMemo(
    () => losses.filter((loss) => statusFilter === "SEMUA" || loss.status === statusFilter),
    [losses, statusFilter]
  );

  return (
    <>
      <Card title="Panel Kontrol Loss">
        <ManagementTable
          data={filteredLosses}
          rowKey={(row) => row.id}
          emptyText="Tidak ada data loss yang sesuai filter."
          searchPlaceholder="Cari tiket, teknisi, lokasi, atau status"
          searchableText={(row) => [row.ticketId, row.technicianName, row.area, row.itemId, row.status, row.note].join(" ")}
          controls={(
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <span>Filter Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                <option value="SEMUA">Semua</option>
                <option value="MENUNGGU">Menunggu</option>
                <option value="DALAM_INVESTIGASI">Dalam Investigasi</option>
                <option value="DISETUJUI">Disetujui</option>
                <option value="DITOLAK">Ditolak</option>
              </select>
            </label>
          )}
          columns={[
            {
              key: "ticket",
              header: "Ticket / Lokasi",
              sortValue: (row) => row.ticketId,
              render: (row) => (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">{row.ticketId}</p>
                  <p className="text-xs text-gray-500">{row.area}</p>
                </div>
              )
            },
            {
              key: "technician",
              header: "Teknisi / Item",
              render: (row) => (
                <div className="space-y-1">
                  <p className="font-medium text-gray-800">{row.technicianName}</p>
                  <p className="text-xs text-gray-500">{row.itemId} • Qty {row.quantityLost}</p>
                </div>
              )
            },
            {
              key: "note",
              header: "Ringkasan Loss",
              render: (row) => (
                <div className="space-y-1">
                  <p className="text-sm text-gray-700">{row.note}</p>
                  <p className="text-xs text-gray-500">Loss {row.lossPercent}%</p>
                </div>
              )
            },
            {
              key: "evidence",
              header: "Bukti / Status",
              sortValue: (row) => row.status,
              render: (row) => (
                <div className="space-y-2">
                  <div className="inline-flex rounded-md border border-dashed border-gray-300 bg-gray-50 px-2 py-1 text-xs text-gray-500">
                    {row.photoUrl ? "Preview tersedia" : "Placeholder foto"}
                  </div>
                  <div>
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                      {row.status}
                    </span>
                  </div>
                </div>
              )
            },
            {
              key: "actions",
              header: "Aksi",
              render: (row) => (
                <div className="flex flex-wrap justify-end gap-2">
                  <IconActionButton icon={<Check size={16} />} label="Approve Loss" onClick={() => onApprove(row.id)} disabled={row.status === "DISETUJUI"} />
                  <IconActionButton icon={<X size={16} />} label="Reject Loss" tone="danger" onClick={() => { setRejectingId(row.id); setRejectReason(""); }} />
                  <IconActionButton icon={<Files size={16} />} label="Minta Bukti Tambahan" onClick={() => onRequestEvidence(row.id)} />
                  <IconActionButton icon={<FileSearch size={16} />} label="Mulai Investigasi" onClick={() => onInvestigate(row.id)} />
                </div>
              ),
              cellClassName: "text-right"
            }
          ] satisfies ManagementTableColumn<LossReport>[]}
        />
      </Card>

      {rejectingId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold">Alasan Penolakan Loss</h3>
            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              className="mt-4 min-h-32 w-full rounded-md border border-gray-300 p-3 text-sm"
              placeholder="Tulis alasan penolakan..."
            />
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="secondary" className="px-4 py-2" onClick={() => setRejectingId(null)}>
                Batal
              </Button>
              <Button className="px-4 py-2" onClick={() => { onReject(rejectingId, rejectReason); setRejectingId(null); }} disabled={rejectReason.trim().length < 5}>
                Simpan Penolakan
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
