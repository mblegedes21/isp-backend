"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTicketStore } from "@/store/useTicketStore";
import type { EscalationStatus, TicketEscalation } from "@/types/ticket";

interface EscalationInboxProps {
  rows: TicketEscalation[];
  title?: string;
}

const statusTone: Record<EscalationStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  approved: "bg-blue-100 text-blue-900",
  rejected: "bg-slate-200 text-slate-800",
  resolved: "bg-emerald-100 text-emerald-900",
};

export function EscalationInbox({ rows, title = "Escalation Inbox" }: EscalationInboxProps) {
  const updateEscalationStatus = useTicketStore((state) => state.updateEscalationStatus);
  const [message, setMessage] = useState("");
  const [loadingId, setLoadingId] = useState<string>("");

  const orderedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const urgencyScore = (row: TicketEscalation) => {
        if (row.severity === "critical") return 4;
        if (row.requiresImmediateAction) return 3;
        if (row.severity === "high") return 2;
        return 1;
      };

      return urgencyScore(b) - urgencyScore(a);
    });
  }, [rows]);

  const onUpdate = async (id: string, status: Extract<EscalationStatus, "approved" | "rejected" | "resolved">) => {
    setLoadingId(id);
    const result = await updateEscalationStatus(id, status);
    setLoadingId("");
    setMessage(result.message);
  };

  return (
    <Card title={title}>
      <div className="space-y-3">
        {orderedRows.length === 0 ? <p className="text-sm text-slate-500">Belum ada eskalasi.</p> : null}
        {orderedRows.map((row) => (
          <div key={row.id} className={`rounded-2xl border p-4 ${row.severity === "critical" || row.requiresImmediateAction ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">{row.ticketId} • {row.type.replaceAll("_", " ")}</p>
                <p className="mt-1 text-sm text-slate-700">{row.description}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Dibuat oleh {row.createdByName ?? row.role} • Severity {row.severity} • Impact {row.impact}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {row.requiresImmediateAction ? <span className="rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white">URGENT</span> : null}
                <span className={`rounded-full px-2 py-1 text-xs font-bold ${statusTone[row.status]}`}>{row.status.toUpperCase()}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" disabled={loadingId === row.id || row.status === "approved"} onClick={() => void onUpdate(row.id, "approved")}>
                Approve
              </Button>
              <Button type="button" variant="secondary" disabled={loadingId === row.id || row.status === "rejected"} onClick={() => void onUpdate(row.id, "rejected")}>
                Reject
              </Button>
              <Button type="button" disabled={loadingId === row.id || row.status === "resolved"} onClick={() => void onUpdate(row.id, "resolved")}>
                Resolve
              </Button>
            </div>
          </div>
        ))}
        {message ? <p className="text-sm text-slate-700">{message}</p> : null}
      </div>
    </Card>
  );
}
