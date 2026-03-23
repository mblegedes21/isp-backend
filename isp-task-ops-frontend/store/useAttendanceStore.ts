"use client";

import { create } from "zustand";
import { apiClient, buildActorHeaders, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import type { AttendanceRecord } from "@/types/attendance";

interface AttendanceStore {
  checkedIn: boolean;
  checkedOut: boolean;
  statusText: string;
  history: AttendanceRecord[];
  checkIn: (payload: { latitude: number; longitude: number; accuracy: number; photoBlob: Blob; fileName?: string }) => Promise<void>;
  checkOut: (payload: { latitude: number; longitude: number; accuracy: number; photoBlob: Blob; fileName?: string }) => Promise<{ ok: boolean; message: string }>;
  getTodayRecords: () => AttendanceRecord[];
  getFlaggedRecords: () => AttendanceRecord[];
  requestExplanation: (id: string) => Promise<void>;
  sendWarning: (id: string) => Promise<void>;
  notifyLeader: (id: string) => Promise<void>;
  markReviewed: (id: string) => Promise<void>;
}

const unwrapAttendancePayload = <T>(payload: T | { success?: boolean; message?: string; data?: T }) => {
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    return (payload as { data?: T }).data as T;
  }

  return payload as T;
};

const today = () => new Date().toISOString().slice(0, 10);
const timeNow = () => new Date().toTimeString().slice(0, 5);

export const useAttendanceStore = create<AttendanceStore>((set, get) => ({
  checkedIn: false,
  checkedOut: false,
  statusText: "Not checked in",
  history: [],
  checkIn: async (payload) => {
    const date = today();
    const existing = get().history.find((item) => item.date === date);

    if (existing?.checkInAt) return;

    const actor = useAuthStore.getState().user;
    try {
      const formData = new FormData();
      formData.append("latitude", String(payload.latitude));
      formData.append("longitude", String(payload.longitude));
      formData.append("accuracy", String(payload.accuracy));
      formData.append("photo", payload.photoBlob, payload.fileName ?? `attendance-check-in-${Date.now()}.webp`);
      if (actor?.id) {
        formData.append("user_id", actor.id);
      }

      const { data } = await apiClient.post(
        "/attendance/check-in",
        formData,
        {
          headers: {
            ...buildActorHeaders(actor),
            "Content-Type": "multipart/form-data"
          }
        }
      );
      const recordPayload = unwrapAttendancePayload<Record<string, unknown>>(data);

      const newRecord: AttendanceRecord = {
        id: String(recordPayload.id),
        userId: String(recordPayload.user_id),
        technicianName: (recordPayload.user as { name?: string } | undefined)?.name,
        area: ((recordPayload.branch as { name?: string } | undefined)?.name) ?? actor?.branchName ?? "Tanpa Area",
        date,
        checkInAt: recordPayload.check_in ? new Date(String(recordPayload.check_in)).toTimeString().slice(0, 5) : timeNow(),
        gps: String(recordPayload.gps ?? recordPayload.location ?? ""),
        photo: String(recordPayload.photo_path ?? recordPayload.photo ?? ""),
        photoPath: String(recordPayload.photo_path ?? recordPayload.photo ?? ""),
        latitude: recordPayload.latitude ? Number(recordPayload.latitude) : payload.latitude,
        longitude: recordPayload.longitude ? Number(recordPayload.longitude) : payload.longitude,
        accuracy: recordPayload.accuracy ? Number(recordPayload.accuracy) : payload.accuracy,
        flagged: Boolean(recordPayload.flagged)
      };

      set({
        checkedIn: true,
        checkedOut: false,
        statusText: "Checked in",
        history: [newRecord, ...get().history.filter((item) => item.id !== newRecord.id)]
      });
    } catch (error) {
      throw new Error(extractApiMessage(error, "Gagal check-in."));
    }
  },
  checkOut: async (payload) => {
    if (!get().checkedIn) {
      return { ok: false, message: "Check-in required before check-out." };
    }

    try {
      const actor = useAuthStore.getState().user;
      const formData = new FormData();
      formData.append("latitude", String(payload.latitude));
      formData.append("longitude", String(payload.longitude));
      formData.append("accuracy", String(payload.accuracy));
      formData.append("photo", payload.photoBlob, payload.fileName ?? `attendance-check-out-${Date.now()}.webp`);
      if (actor?.id) {
        formData.append("user_id", actor.id);
      }

      const { data } = await apiClient.post(
        "/attendance/check-out",
        formData,
        {
          headers: {
            ...buildActorHeaders(actor),
            "Content-Type": "multipart/form-data"
          }
        }
      );
      const recordPayload = unwrapAttendancePayload<Record<string, unknown>>(data);

      const date = today();
      set({
        checkedOut: true,
        statusText: "Checked out",
        history: get().history.map((record) =>
          record.date === date && !record.checkOutAt
            ? {
                ...record,
                checkOutAt: recordPayload.check_out ? new Date(String(recordPayload.check_out)).toTimeString().slice(0, 5) : timeNow(),
                photo: String(recordPayload.photo_path ?? recordPayload.photo ?? ""),
                photoPath: String(recordPayload.photo_path ?? recordPayload.photo ?? ""),
                latitude: recordPayload.latitude ? Number(recordPayload.latitude) : payload.latitude,
                longitude: recordPayload.longitude ? Number(recordPayload.longitude) : payload.longitude,
                accuracy: recordPayload.accuracy ? Number(recordPayload.accuracy) : payload.accuracy
              }
            : record
        )
      });

      return { ok: true, message: (data as { message?: string }).message ?? "Checked out successfully." };
    } catch (error) {
      return { ok: false, message: extractApiMessage(error, "Gagal check-out.") };
    }
  },
  getTodayRecords: () => get().history.filter((record) => record.date === today()),
  getFlaggedRecords: () => get().history.filter((record) => record.flagged),
  requestExplanation: async (id) => {
    const actor = useAuthStore.getState().user;
    const flagId = get().history.find((record) => record.id === id || record.flagId === id)?.flagId ?? id;
    await apiClient.post(`/attendance-flags/${flagId}/status`, { status: "MENUNGGU_PENJELASAN" }, { headers: buildActorHeaders(actor) });
    set({
      history: get().history.map((record) =>
        record.id === id ? { ...record, reviewStatus: "MENUNGGU_PENJELASAN" } : record
      )
    });
  },
  sendWarning: async (id) => {
    const actor = useAuthStore.getState().user;
    const flagId = get().history.find((record) => record.id === id || record.flagId === id)?.flagId ?? id;
    await apiClient.post(`/attendance-flags/${flagId}/status`, { status: "PERINGATAN_TERKIRIM" }, { headers: buildActorHeaders(actor) });
    set({
      history: get().history.map((record) =>
        record.id === id ? { ...record, reviewStatus: "PERINGATAN_TERKIRIM" } : record
      )
    });
  },
  notifyLeader: async (id) => {
    const actor = useAuthStore.getState().user;
    const flagId = get().history.find((record) => record.id === id || record.flagId === id)?.flagId ?? id;
    await apiClient.post(`/attendance-flags/${flagId}/status`, { status: "LEADER_DINOTIFIKASI" }, { headers: buildActorHeaders(actor) });
    set({
      history: get().history.map((record) =>
        record.id === id ? { ...record, reviewStatus: "LEADER_DINOTIFIKASI" } : record
      )
    });
  },
  markReviewed: async (id) => {
    const actor = useAuthStore.getState().user;
    const flagId = get().history.find((record) => record.id === id || record.flagId === id)?.flagId ?? id;
    await apiClient.post(`/attendance-flags/${flagId}/status`, { status: "SELESAI" }, { headers: buildActorHeaders(actor) });
    set({
      history: get().history.map((record) =>
        record.id === id ? { ...record, reviewStatus: "SELESAI" } : record
      )
    });
  }
}));
