"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useTicketStore } from "@/store/useTicketStore";
import type { EscalationImpact, EscalationSeverity, EscalationType, Ticket } from "@/types/ticket";

const escalationTypes: Array<{ value: EscalationType; label: string }> = [
  { value: "disaster", label: "Disaster" },
  { value: "external_blocker", label: "External Blocker" },
  { value: "permit_issue", label: "Permit Issue" },
  { value: "technical_blocker", label: "Technical Blocker" },
  { value: "safety_issue", label: "Safety Issue" },
  { value: "operational_issue", label: "Operational Issue" },
  { value: "emergency", label: "Emergency" },
];

const severities: Array<{ value: EscalationSeverity; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const impacts: Array<{ value: EscalationImpact; label: string }> = [
  { value: "single_user", label: "Single User" },
  { value: "area", label: "Area" },
  { value: "multiple_area", label: "Multiple Area" },
  { value: "outage", label: "Outage" },
];

interface EscalationModalProps {
  ticket: Ticket;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EscalationModal({ ticket, open, onClose, onSuccess }: EscalationModalProps) {
  const createEscalation = useTicketStore((state) => state.createEscalation);
  const [type, setType] = useState<EscalationType>("technical_blocker");
  const [severity, setSeverity] = useState<EscalationSeverity>("high");
  const [impact, setImpact] = useState<EscalationImpact>("single_user");
  const [requiresImmediateAction, setRequiresImmediateAction] = useState(false);
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => Boolean(ticket.id) && description.trim().length > 0, [description, ticket.id]);

  if (!open) {
    return null;
  }

  const onSubmit = async () => {
    if (!ticket.id) {
      setMessage("Ticket tidak ditemukan.");
      return;
    }

    if (!description.trim()) {
      setMessage("Deskripsi escalation wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const result = await createEscalation(ticket.id, {
      type,
      severity,
      impact,
      requiresImmediateAction,
      description: description.trim(),
    });

    setIsSubmitting(false);
    setMessage(result.message);

    if (result.ok) {
      setDescription("");
      setRequiresImmediateAction(false);
      onSuccess?.();
      window.setTimeout(() => {
        onClose();
      }, 250);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-700/70">Ticket Detail</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Buat Escalation</h2>
            <p className="mt-1 text-sm text-slate-600">Ticket {ticket.id} akan dieskalasikan ke manager untuk keputusan lanjutan.</p>
          </div>
          <Button type="button" variant="secondary" onClick={onClose}>
            Tutup
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-800">Type</label>
            <select className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" value={type} onChange={(event) => setType(event.target.value as EscalationType)}>
              {escalationTypes.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-800">Severity</label>
            <select className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" value={severity} onChange={(event) => setSeverity(event.target.value as EscalationSeverity)}>
              {severities.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-800">Impact</label>
            <select className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" value={impact} onChange={(event) => setImpact(event.target.value as EscalationImpact)}>
              {impacts.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={requiresImmediateAction} onChange={(event) => setRequiresImmediateAction(event.target.checked)} />
            Requires immediate action
          </label>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-semibold text-slate-800">Description</label>
          <textarea
            className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Jelaskan blocker lapangan, dampak operasional, dan kenapa manager perlu turun tangan."
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => void onSubmit()} disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Buat Escalation"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          {message ? <p className="text-sm text-slate-700">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
