"use client";

import { create } from "zustand";
import { apiClient, buildActorHeaders, extractApiMessage } from "@/lib/api";
import { canTransitionTicketStatus } from "@/lib/business-rules";
import { useAuthStore } from "@/store/useAuthStore";
import type { LeaderOption, TechnicianProfile } from "@/types/operations";
import type { EscalationImpact, EscalationSeverity, EscalationStatus, EscalationType, Ticket, TicketEscalation, TicketStatus } from "@/types/ticket";

type AssignmentPayload = {
  ticketId: string;
  leaderId?: string;
  priority?: Ticket["priority"];
  technicians: string[];
  materials: Array<{
    materialId: string;
    technicianId: string;
    quantity: number;
  }>;
};

interface TicketState {
  tickets: Ticket[];
  escalations: TicketEscalation[];
  leaders: LeaderOption[];
  technicians: TechnicianProfile[];
  fetchTickets: (filters?: { status?: string }) => Promise<Ticket[]>;
  fetchTicketById: (ticketId: string) => Promise<Ticket>;
  createTicket: (payload: {
    customerLocation: string;
    description: string;
    branch: string;
    issueType: string;
    priority: string;
  }) => Promise<Ticket>;
  getById: (id: string) => Ticket | undefined;
  transitionStatus: (id: string, nextStatus: TicketStatus) => Promise<{ ok: boolean; message: string }>;
  toggleEscalation: (id: string) => Promise<{ ok: boolean; message: string }>;
  fetchEscalations: (filters?: { status?: EscalationStatus; severity?: EscalationSeverity; type?: EscalationType }) => Promise<TicketEscalation[]>;
  fetchTicketEscalations: (ticketId: string) => Promise<TicketEscalation[]>;
  createEscalation: (ticketId: string, payload: {
    type: EscalationType;
    severity: EscalationSeverity;
    impact: EscalationImpact;
    requiresImmediateAction: boolean;
    description: string;
  }) => Promise<{ ok: boolean; message: string }>;
  updateEscalationStatus: (escalationId: string, status: Extract<EscalationStatus, "approved" | "rejected" | "resolved">) => Promise<{ ok: boolean; message: string }>;
  assignTicket: (payload: AssignmentPayload) => Promise<{ ok: boolean; message: string }>;
  escalateTicket: (ticketId: string, reason: string) => Promise<{ ok: boolean; message: string }>;
  sendSupportTeam: (ticketId: string) => Promise<{ ok: boolean; message: string }>;
}

type TicketApiPayload = {
  id?: string | number;
  nomor_ticket?: string | number;
  title?: string;
  description?: string | null;
  area_id?: string | number | null;
  problem_type?: string;
  priority?: Ticket["priority"];
  leader_id?: string | number | null;
  technician_id?: string | number | null;
  created_by?: string | number | null;
  branch?: string;
  branch_id?: string | number | null;
  area?: { name?: string } | null;
  leader?: { id?: string | number; name?: string } | null;
  technician?: { id?: string | number; name?: string } | null;
  technicians?: Array<{ id?: string | number; name?: string }> | null;
  status?: TicketStatus;
  created_at?: string;
  updated_at?: string;
  escalations?: Array<Record<string, unknown>>;
};

const unwrapApiData = <T>(payload: T | { success?: boolean; message?: string; data?: T }) => {
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    return (payload as { data?: T }).data as T;
  }

  return payload as T;
};

const normalizeEscalation = (data: Record<string, unknown>): TicketEscalation => ({
  id: String(data.id ?? ""),
  ticketId: String(data.ticket_id ?? ""),
  ticketDbId: data.ticket_db_id ? String(data.ticket_db_id) : undefined,
  ticketTitle: typeof data.ticket_title === "string" ? data.ticket_title : undefined,
  ticketStatus: typeof data.ticket_status === "string" ? data.ticket_status : undefined,
  createdBy: String(data.created_by ?? data.escalated_by ?? ""),
  createdByName: typeof data.created_by_name === "string"
    ? data.created_by_name
    : typeof data.escalator === "object" && data.escalator && "name" in (data.escalator as Record<string, unknown>)
      ? String((data.escalator as Record<string, unknown>).name ?? "")
      : null,
  role: String(data.role ?? "NOC"),
  type: String(data.type ?? "technical_blocker") as EscalationType,
  severity: String(data.severity ?? "medium") as EscalationSeverity,
  impact: String(data.impact ?? "single_user") as EscalationImpact,
  requiresImmediateAction: Boolean(data.requires_immediate_action ?? false),
  description: String(data.description ?? data.note ?? data.reason ?? ""),
  status: String(data.status ?? "pending") as EscalationStatus,
  handledBy: data.handled_by ? String(data.handled_by) : null,
  handledByName: typeof data.handled_by_name === "string" ? data.handled_by_name : null,
  handledAt: typeof data.handled_at === "string" ? data.handled_at : null,
  createdAt: String(data.created_at ?? new Date().toISOString()),
});

const normalizeTicket = (data: TicketApiPayload, actorBranchName?: string | null): Ticket => ({
  id: String(data.nomor_ticket ?? data.id ?? ""),
  dbId: data.id ? String(data.id) : undefined,
  title: data.title ?? "",
  description: data.description ?? "",
  areaId: data.area_id ? String(data.area_id) : "",
  problemType: data.problem_type ?? "",
  priority: data.priority ?? "MEDIUM",
  leaderId: data.leader_id ? String(data.leader_id) : undefined,
  technicianId: data.technician_id ? String(data.technician_id) : undefined,
  technicians: Array.isArray(data.technicians)
    ? data.technicians
        .filter((item) => item?.id)
        .map((item) => ({
          id: String(item?.id),
          name: item?.name ?? "",
        }))
    : undefined,
  createdBy: String(data.created_by ?? ""),
  branch: data.branch ?? data.area?.name ?? actorBranchName ?? "-",
  assignee: Array.isArray(data.technicians) && data.technicians.length > 0
    ? data.technicians.map((item) => item?.name ?? "").filter(Boolean).join(", ")
    : data.technician?.name ?? "",
  status: data.status ?? "CREATED",
  estimatedLossPercent: 0,
  escalations: Array.isArray(data.escalations)
    ? data.escalations.map((item) => normalizeEscalation(item as Record<string, unknown>))
    : [],
  escalated: false,
  escalationReason: "",
  escalationStatus: null,
  hasOpenEscalation: false,
  createdAt: data.created_at ?? new Date().toISOString(),
  updatedAt: data.updated_at ?? new Date().toISOString()
});

const finalizeTicketEscalationState = (ticket: Ticket): Ticket => {
  const latestEscalation = [...(ticket.escalations ?? [])].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  })[0];
  const hasOpenEscalation = (ticket.escalations ?? []).some((item) => item.status === "pending" || item.status === "approved");

  return {
    ...ticket,
    escalated: hasOpenEscalation || ticket.status === "ESCALATED",
    escalationReason: latestEscalation?.description ?? latestEscalation?.type ?? "",
    escalationStatus: latestEscalation?.status ?? null,
    hasOpenEscalation,
  };
};

const normalizeTicketWithEscalations = (data: TicketApiPayload, actorBranchName?: string | null): Ticket => finalizeTicketEscalationState(normalizeTicket(data, actorBranchName));

export const useTicketStore = create<TicketState>((set, get) => ({
  tickets: [],
  escalations: [],
  leaders: [],
  technicians: [],
  fetchTickets: async (filters) => {
    const actor = useAuthStore.getState().user;
    const { data } = await apiClient.get("/tickets", {
      params: filters,
      headers: buildActorHeaders(actor),
    });
    const payload = unwrapApiData<{ data?: TicketApiPayload[] } | TicketApiPayload[]>(data);
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];
    const normalized = rows.map((row) => normalizeTicketWithEscalations(row, actor?.branchName));
    set((state) => {
      if (filters?.status) {
        const filteredStatus = String(filters.status).toUpperCase();
        const remainingTickets = state.tickets.filter((ticket) => {
          const status = String(ticket.status ?? "").toUpperCase();

          if (filteredStatus === "NEW") {
            return !["CREATED", "NEW"].includes(status);
          }

          return status !== filteredStatus;
        });

        return {
          tickets: [...normalized, ...remainingTickets],
          escalations: [
            ...normalized.flatMap((ticket) => ticket.escalations ?? []),
            ...state.escalations.filter((item) => !normalized.some((ticket) => (ticket.escalations ?? []).some((escalation) => escalation.id === item.id))),
          ],
        };
      }

      return {
        tickets: normalized,
        escalations: normalized.flatMap((ticket) => ticket.escalations ?? []),
      };
    });
    return normalized;
  },
  fetchTicketById: async (ticketId) => {
    const actor = useAuthStore.getState().user;
    const { data } = await apiClient.get(`/tickets/${ticketId}`, { headers: buildActorHeaders(actor) });
    const payload = unwrapApiData<TicketApiPayload>(data);
    const normalized = normalizeTicketWithEscalations(payload, actor?.branchName);

    set({
      escalations: [
        ...(normalized.escalations ?? []),
        ...get().escalations.filter((item) => item.ticketId !== normalized.id),
      ],
      tickets: [
        normalized,
        ...get().tickets.filter((ticket) => ticket.id !== normalized.id)
      ]
    });

    return normalized;
  },
  createTicket: async (payload) => {
    const actor = useAuthStore.getState().user;
    try {
      const { data } = await apiClient.post(
        "/tickets",
        {
          customer_location: payload.customerLocation,
          issue_type: payload.issueType,
          description: payload.description,
          branch: payload.branch,
          priority: payload.priority,
          created_by: actor?.id,
        },
        { headers: buildActorHeaders(actor) }
      );
      const created = normalizeTicketWithEscalations(unwrapApiData<TicketApiPayload>(data), actor?.branchName);

      set({
        tickets: [created, ...get().tickets],
        escalations: [...(created.escalations ?? []), ...get().escalations],
      });
      return created;
    } catch (error) {
      throw new Error(extractApiMessage(error, "Gagal membuat tiket."));
    }
  },
  getById: (id) => get().tickets.find((ticket) => ticket.id === id),
  transitionStatus: async (id, nextStatus) => {
    const ticket = get().getById(id);
    if (!ticket) return { ok: false, message: "Ticket not found" };

    if (!canTransitionTicketStatus(ticket.status, nextStatus)) {
      return { ok: false, message: "Invalid transition. Status cannot be skipped." };
    }

    try {
      const actor = useAuthStore.getState().user;
      const { data } = await apiClient.post(
        `/tickets/${id}/transition`,
        { status: nextStatus },
        { headers: buildActorHeaders(actor) }
      );

      set({
        tickets: get().tickets.map((item) =>
          item.id === id
            ? { ...item, status: nextStatus, updatedAt: new Date().toISOString() }
            : item
        )
      });

      return { ok: true, message: data.message ?? "Status updated" };
    } catch (error) {
      return { ok: false, message: extractApiMessage(error, "Gagal memperbarui status tiket.") };
    }
  },
  toggleEscalation: async (id) => {
    const ticket = get().getById(id);
    if (!ticket) return { ok: false, message: "Tiket tidak ditemukan." };

    if (!ticket.escalated) {
      return get().createEscalation(id, {
        type: "technical_blocker",
        severity: "high",
        impact: "single_user",
        requiresImmediateAction: false,
        description: ticket.problemType || "Masalah memerlukan eskalasi manager.",
      });
    }

    return { ok: false, message: "Tiket sudah dieskalasikan." };
  },
  fetchEscalations: async (filters) => {
    const actor = useAuthStore.getState().user;
    const { data } = await apiClient.get("/escalations", {
      params: filters,
      headers: buildActorHeaders(actor),
    });
    const rows = Array.isArray(data.data)
      ? data.data.map((row: Record<string, unknown>) => normalizeEscalation(row))
      : [];

    set((state) => ({
      escalations: rows,
      tickets: state.tickets.map((ticket) => {
        const ticketEscalations = rows.filter((item: TicketEscalation) => item.ticketId === ticket.id || item.ticketDbId === ticket.dbId);
        return ticketEscalations.length > 0
          ? finalizeTicketEscalationState({ ...ticket, escalations: ticketEscalations })
          : ticket;
      }),
    }));

    return rows;
  },
  fetchTicketEscalations: async (ticketId) => {
    const actor = useAuthStore.getState().user;
    const { data } = await apiClient.get(`/tickets/${ticketId}/escalations`, {
      headers: buildActorHeaders(actor),
    });
    const rows = Array.isArray(data.data)
      ? data.data.map((row: Record<string, unknown>) => normalizeEscalation(row))
      : [];

    set((state) => ({
      escalations: [
        ...rows,
        ...state.escalations.filter((item: TicketEscalation) => item.ticketId !== ticketId && item.ticketDbId !== state.tickets.find((ticket) => ticket.id === ticketId)?.dbId),
      ],
      tickets: state.tickets.map((ticket) => ticket.id === ticketId ? finalizeTicketEscalationState({ ...ticket, escalations: rows }) : ticket),
    }));

    return rows;
  },
  createEscalation: async (ticketId, payload) => {
    const actor = useAuthStore.getState().user;

    try {
      const { data } = await apiClient.post(
        `/tickets/${ticketId}/escalations`,
        {
          type: payload.type,
          severity: payload.severity,
          impact: payload.impact,
          requires_immediate_action: payload.requiresImmediateAction,
          description: payload.description,
        },
        { headers: buildActorHeaders(actor) }
      );
      const escalation = normalizeEscalation(data.data as Record<string, unknown>);
      const existingTicket = get().getById(ticketId);
      set((state) => ({
        escalations: [escalation, ...state.escalations.filter((item) => item.id !== escalation.id)],
        tickets: state.tickets.map((ticket) => {
          if (ticket.id !== ticketId) {
            return ticket;
          }

          return finalizeTicketEscalationState({
            ...ticket,
            status: "ESCALATED",
            priority: escalation.severity === "critical" ? "CRITICAL" : ticket.priority === "LOW" || ticket.priority === "MEDIUM" ? "HIGH" : ticket.priority,
            updatedAt: new Date().toISOString(),
            escalations: [escalation, ...(ticket.escalations ?? [])],
          });
        }),
      }));

      if (!existingTicket) {
        void get().fetchTicketById(ticketId).catch(() => undefined);
      }

      return { ok: true, message: data.message ?? "Eskalasi berhasil dibuat." };
    } catch (error) {
      return { ok: false, message: extractApiMessage(error, "Gagal membuat eskalasi.") };
    }
  },
  updateEscalationStatus: async (escalationId, status) => {
    const actor = useAuthStore.getState().user;

    try {
      const { data } = await apiClient.patch(
        `/escalations/${escalationId}`,
        { status },
        { headers: buildActorHeaders(actor) }
      );
      const escalation = normalizeEscalation(data.data as Record<string, unknown>);

      set((state) => ({
        escalations: [escalation, ...state.escalations.filter((item) => item.id !== escalation.id)],
        tickets: state.tickets.map((ticket) => {
          if (ticket.id !== escalation.ticketId && ticket.dbId !== escalation.ticketDbId) {
            return ticket;
          }

          const nextEscalations = [escalation, ...(ticket.escalations ?? []).filter((item) => item.id !== escalation.id)];
          const hasOpenEscalation = nextEscalations.some((item) => item.status === "pending" || item.status === "approved");

          return finalizeTicketEscalationState({
            ...ticket,
            status: !hasOpenEscalation && ticket.status === "ESCALATED"
              ? (escalation.ticketStatus as TicketStatus | undefined) ?? "IN_PROGRESS"
              : ticket.status,
            updatedAt: new Date().toISOString(),
            escalations: nextEscalations,
          });
        }),
      }));

      return { ok: true, message: data.message ?? "Status eskalasi berhasil diperbarui." };
    } catch (error) {
      return { ok: false, message: extractApiMessage(error, "Gagal memperbarui status eskalasi.") };
    }
  },
  assignTicket: async (payload) => {
    const ticket = get().getById(payload.ticketId) ?? await get().fetchTicketById(payload.ticketId).catch(() => undefined);
    if (!ticket) return { ok: false, message: "Ticket tidak ditemukan." };

    if (!["CREATED", "NEW"].includes(String(ticket.status ?? "").toUpperCase())) {
      return { ok: false, message: "Ticket sudah ditugaskan." };
    }

    const assignedTechnicians = get().technicians.filter((item) => payload.technicians.includes(item.id));
    if (assignedTechnicians.length === 0) {
      return { ok: false, message: "Pilih minimal 1 teknisi yang valid." };
    }

    const invalidMaterial = payload.materials.find((item) => {
      const quantity = Number(item.quantity);
      return !item.materialId || !item.technicianId || !Number.isFinite(quantity) || quantity < 1;
    });
    if (invalidMaterial) {
      return { ok: false, message: "Setiap material wajib memiliki technician_id dan quantity valid." };
    }

    const hasUnknownTechnician = payload.materials.some((item) => !payload.technicians.includes(item.technicianId));
    if (hasUnknownTechnician) {
      return { ok: false, message: "Material harus dipetakan ke teknisi yang dipilih." };
    }

    const leader = payload.leaderId ? get().leaders.find((item) => item.id === payload.leaderId) : undefined;
    const assigneeName = assignedTechnicians.map((item) => item.name).join(", ");

    try {
      const actor = useAuthStore.getState().user;
      console.log("ASSIGN SUBMIT START");
      console.log("ASSIGN PAYLOAD", payload);
      const { data } = await apiClient.post(
        `/tickets/${payload.ticketId}/assign`,
        {
          leader_id: payload.leaderId,
          priority: payload.priority ?? "MEDIUM",
          technicians: assignedTechnicians.map((item) => Number(item.id)),
          materials: payload.materials.map((item) => ({
            material_id: Number(item.materialId),
            teknisi_id: Number(item.technicianId),
            quantity: Number(item.quantity),
          })),
        },
        { headers: buildActorHeaders(actor) }
      );
      console.log("ASSIGN API CALLED");

      set({
        tickets: get().tickets.map((item) =>
          item.id === payload.ticketId
            ? {
                ...item,
                leaderId: payload.leaderId,
                technicianId: assignedTechnicians[0]?.id,
                technicians: assignedTechnicians.map((item) => ({ id: item.id, name: item.name })),
                priority: payload.priority ?? item.priority,
                assignee: assigneeName,
                status: "ASSIGNED",
                updatedAt: new Date().toISOString()
              }
            : item
        )
      });

      return { ok: true, message: data.message ?? `Tiket berhasil di-assign ke ${assigneeName}${leader ? ` di bawah ${leader.name}` : ""}.` };
    } catch (error) {
      console.error("ASSIGN API ERROR", error);
      return { ok: false, message: extractApiMessage(error, "Gagal mengassign tiket.") };
    }
  },
  escalateTicket: async (ticketId, reason) => {
    return get().createEscalation(ticketId, {
      type: "technical_blocker",
      severity: "high",
      impact: "single_user",
      requiresImmediateAction: false,
      description: reason,
    });
  },
  sendSupportTeam: async (ticketId) => {
    const ticket = get().getById(ticketId);
    if (!ticket) return { ok: false, message: "Tiket tidak ditemukan." };

    try {
      const actor = useAuthStore.getState().user;
      const { data } = await apiClient.post(
        `/tickets/${ticketId}/support-team`,
        {},
        { headers: buildActorHeaders(actor) }
      );

      set({
        tickets: get().tickets.map((item) =>
          item.id === ticketId
            ? {
                ...item,
                assignee: item.assignee ? `${item.assignee}, Tim Tambahan` : "Tim Tambahan",
                priority: item.priority === "LOW" ? "MEDIUM" : item.priority,
                updatedAt: new Date().toISOString()
              }
            : item
        )
      });

      return { ok: true, message: data.message ?? "Tim tambahan sudah ditandai pada tiket." };
    } catch (error) {
      return { ok: false, message: extractApiMessage(error, "Gagal mengirim tim tambahan.") };
    }
  }
}));
