"use client";

import { create } from "zustand";
import { apiClient, buildActorHeaders } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import type { AreaActionRecord, AuditLogItem, IncidentAlert } from "@/types/operations";

interface ManagerStore {
  auditLogs: AuditLogItem[];
  incidents: IncidentAlert[];
  areaActions: AreaActionRecord[];
  addAuditLog: (payload: Omit<AuditLogItem, "id" | "createdAt" | "reviewStatus">) => Promise<void>;
  investigateAuditUser: (id: string) => Promise<void>;
  requestAuditClarification: (id: string) => Promise<void>;
  markAuditReviewed: (id: string) => Promise<void>;
  recordAreaAction: (areaName: string, action: string) => Promise<void>;
  respondToIncident: (id: string, action: string) => Promise<void>;
}

export const useManagerStore = create<ManagerStore>((set, get) => ({
  auditLogs: [],
  incidents: [],
  areaActions: [],
  addAuditLog: async (payload) => {
    const actor = useAuthStore.getState().user;
    await apiClient.post(
      "/audit-logs",
      {
        action_type: payload.actionType,
        entity_type: payload.entityType,
        entity_id: payload.entityId,
        before: payload.before,
        after: payload.after,
        source: payload.source
      },
      { headers: buildActorHeaders(actor) }
    );

    const entry: AuditLogItem = {
      id: `LOG-${Date.now()}`,
      createdAt: new Date().toISOString(),
      reviewStatus: "BARU",
      ...payload
    };

    set({ auditLogs: [entry, ...get().auditLogs] });
  },
  investigateAuditUser: async (id) => {
    const actor = useAuthStore.getState().user;
    await apiClient.post(`/audit-logs/${id}/review`, { review_status: "DIINVESTIGASI" }, { headers: buildActorHeaders(actor) });
    set({
      auditLogs: get().auditLogs.map((item) =>
        item.id === id ? { ...item, reviewStatus: "DIINVESTIGASI" } : item
      )
    });
  },
  requestAuditClarification: async (id) => {
    const actor = useAuthStore.getState().user;
    await apiClient.post(`/audit-logs/${id}/review`, { review_status: "KLARIFIKASI" }, { headers: buildActorHeaders(actor) });
    set({
      auditLogs: get().auditLogs.map((item) =>
        item.id === id ? { ...item, reviewStatus: "KLARIFIKASI" } : item
      )
    });
  },
  markAuditReviewed: async (id) => {
    const actor = useAuthStore.getState().user;
    await apiClient.post(`/audit-logs/${id}/review`, { review_status: "SELESAI" }, { headers: buildActorHeaders(actor) });
    set({
      auditLogs: get().auditLogs.map((item) =>
        item.id === id ? { ...item, reviewStatus: "SELESAI" } : item
      )
    });
  },
  recordAreaAction: async (areaName, action) => {
    const actor = useAuthStore.getState().user;
    await apiClient.post("/area-actions", { area_name: areaName, action }, { headers: buildActorHeaders(actor) });
    const entry: AreaActionRecord = {
      id: `AREA-ACT-${Date.now()}`,
      areaName,
      action,
      createdAt: new Date().toISOString()
    };

    set({ areaActions: [entry, ...get().areaActions] });
  },
  respondToIncident: async (id, action) => {
    const actor = useAuthStore.getState().user;
    await apiClient.post(`/incidents/${id}/respond`, { action }, { headers: buildActorHeaders(actor) });
    set({
      incidents: get().incidents.map((incident) =>
        incident.id === id
          ? {
              ...incident,
              responseStatus:
                action === "Deklarasikan Insiden"
                  ? "DALAM_RESPON"
                  : action === "Notifikasi Semua Teknisi"
                    ? "DIKOMUNIKASIKAN"
                    : "DALAM_RESPON"
            }
          : incident
      )
    });
  }
}));
