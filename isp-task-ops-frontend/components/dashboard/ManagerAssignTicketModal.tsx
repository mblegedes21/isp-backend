"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { LeaderOption, TechnicianProfile } from "@/types/operations";
import type { Ticket } from "@/types/ticket";

interface ManagerAssignTicketModalProps {
  open: boolean;
  ticket: Ticket | null;
  leaders: LeaderOption[];
  technicians: TechnicianProfile[];
  onClose: () => void;
  onAssign: (payload: {
    ticketId: string;
    leaderId: string;
    technicianId: string;
    priority: Ticket["priority"];
  }) => { ok: boolean; message: string };
}

const priorityOptions: Array<{ value: Ticket["priority"]; label: string }> = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" }
];

export function ManagerAssignTicketModal({
  open,
  ticket,
  leaders,
  technicians,
  onClose,
  onAssign
}: ManagerAssignTicketModalProps) {
  const [leaderId, setLeaderId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [priority, setPriority] = useState<Ticket["priority"]>("MEDIUM");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!ticket || !open) return;
    setLeaderId(ticket.leaderId ?? leaders[0]?.id ?? "");
    setTechnicianId(ticket.technicianId ?? technicians[0]?.id ?? "");
    setPriority(ticket.priority === "CRITICAL" ? "HIGH" : ticket.priority);
    setFeedback("");
    setIsSubmitting(false);
  }, [leaders, open, technicians, ticket]);

  if (!open || !ticket) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setFeedback("");

    await new Promise((resolve) => window.setTimeout(resolve, 350));

    const result = onAssign({
      ticketId: ticket.id,
      leaderId,
      technicianId,
      priority
    });

    setFeedback(result.message);
    setIsSubmitting(false);

    if (result.ok) {
      window.setTimeout(() => {
        onClose();
      }, 250);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Penugasan Tiket</p>
          <h2 className="mt-1 text-xl font-bold text-app-text">{ticket.id}</h2>
          <p className="text-sm text-gray-600">{ticket.title}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="block text-sm font-semibold text-gray-700">Leader</span>
            <select
              value={leaderId}
              onChange={(event) => setLeaderId(event.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {leaders.map((leader) => (
                <option key={leader.id} value={leader.id}>
                  {leader.name} - {leader.area}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-semibold text-gray-700">Teknisi</span>
            <select
              value={technicianId}
              onChange={(event) => setTechnicianId(event.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {technicians.map((technician) => (
                <option key={technician.id} value={technician.id}>
                  {technician.name} - {technician.area}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-semibold text-gray-700">Prioritas</span>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as Ticket["priority"])}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {feedback ? <p className="mt-4 text-sm text-gray-700">{feedback}</p> : null}

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} className="px-4 py-2">
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !leaderId || !technicianId} className="px-4 py-2">
            {isSubmitting ? "Memproses..." : "Tugaskan Tiket"}
          </Button>
        </div>
      </div>
    </div>
  );
}
