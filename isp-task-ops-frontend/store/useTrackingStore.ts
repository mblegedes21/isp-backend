"use client";

import { create } from "zustand";
import { apiClient, buildActorHeaders } from "@/lib/api";
import { evaluateLocationRisk, haversineDistanceMeter } from "@/lib/location-rules";
import { useAuthStore } from "@/store/useAuthStore";
import { useTicketStore } from "@/store/useTicketStore";
import type { ProgressType, TechnicianLocationLog, TicketProgressPhotoRecord } from "@/types/tracking";

interface TrackingState {
  locationLogs: TechnicianLocationLog[];
  progressPhotos: TicketProgressPhotoRecord[];
  updateTechnicianLocation: (payload: {
    userId: string;
    technicianName: string;
    ticketId?: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    sourceType: TechnicianLocationLog["sourceType"];
  }) => Promise<TechnicianLocationLog>;
  submitProgressPhoto: (payload: {
    ticketId: string;
    userId: string;
    progressType: ProgressType;
    imagePath: string;
    imageSizeKb: number;
    latitude: number;
    longitude: number;
    accuracy: number;
    imageBlob: Blob;
    deviceTimestamp: string;
  }) => Promise<TicketProgressPhotoRecord>;
  getLatestLocations: () => TechnicianLocationLog[];
}

export const useTrackingStore = create<TrackingState>((set, get) => ({
  locationLogs: [],
  progressPhotos: [],
  updateTechnicianLocation: async (payload) => {
    const ticket = useTicketStore.getState().tickets.find((item) => item.id === payload.ticketId);
    const technician = useTicketStore.getState().technicians.find((item) => item.id === payload.userId);
    const previousLogs = get().locationLogs.filter((item) => item.userId === payload.userId).slice(0, 5);
    const distance =
      ticket?.ticketLatitude && ticket?.ticketLongitude
        ? haversineDistanceMeter(ticket.ticketLatitude, ticket.ticketLongitude, payload.latitude, payload.longitude)
        : 0;
    const risk = evaluateLocationRisk({
      accuracy: payload.accuracy,
      distance,
      previousLogs,
      latitude: payload.latitude,
      longitude: payload.longitude,
      assignedArea: technician?.area,
      ticketArea: ticket?.branch
    });

    const record: TechnicianLocationLog = {
      id: `LOC-${Date.now()}`,
      userId: payload.userId,
      technicianName: payload.technicianName,
      ticketId: payload.ticketId,
      branch: ticket?.branch ?? technician?.area ?? "Tanpa Branch",
      area: ticket?.branch ?? technician?.area ?? "Tanpa Area",
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy: payload.accuracy,
      calculatedDistanceMeter: Math.round(distance),
      locationStatus: risk.locationStatus,
      needsReview: risk.locationStatus === "suspicious",
      riskScore: risk.riskScore,
      riskReasons: risk.riskReasons,
      sourceType: payload.sourceType,
      createdAt: new Date().toISOString()
    };

    const actor = useAuthStore.getState().user;
    await apiClient.post(
      "/technician-locations",
      {
        user_id: payload.userId,
        ticket_id: payload.ticketId,
        latitude: payload.latitude,
        longitude: payload.longitude,
        accuracy: payload.accuracy,
        source_type: payload.sourceType
      },
      { headers: buildActorHeaders(actor) }
    );

    set({ locationLogs: [record, ...get().locationLogs] });
    return record;
  },
  submitProgressPhoto: async (payload) => {
    const ticket = useTicketStore.getState().tickets.find((item) => item.id === payload.ticketId);
    const technician = useTicketStore.getState().technicians.find((item) => item.id === payload.userId);
    const previousLogs = get().locationLogs.filter((item) => item.userId === payload.userId).slice(0, 5);
    const distance =
      ticket?.ticketLatitude && ticket?.ticketLongitude
        ? haversineDistanceMeter(ticket.ticketLatitude, ticket.ticketLongitude, payload.latitude, payload.longitude)
        : 0;
    const risk = evaluateLocationRisk({
      accuracy: payload.accuracy,
      distance,
      previousLogs,
      latitude: payload.latitude,
      longitude: payload.longitude,
      assignedArea: technician?.area,
      ticketArea: ticket?.branch,
      progressType: payload.progressType
    });

    const record: TicketProgressPhotoRecord = {
      id: `TPP-${Date.now()}`,
      ticketId: payload.ticketId,
      userId: payload.userId,
      progressType: payload.progressType,
      imagePath: payload.imagePath,
      imageSizeKb: payload.imageSizeKb,
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy: payload.accuracy,
      calculatedDistanceMeter: Math.round(distance),
      locationStatus: risk.locationStatus,
      needsReview: risk.locationStatus === "suspicious",
      riskScore: risk.riskScore,
      riskReasons: risk.riskReasons,
      capturedAtServer: new Date().toISOString(),
      uploadedAtServer: new Date().toISOString()
    };

    const actor = useAuthStore.getState().user;
    const formData = new FormData();
    formData.append("ticket_id", payload.ticketId);
    formData.append("user_id", payload.userId);
    formData.append("progress_type", payload.progressType);
    formData.append("image", payload.imageBlob, `${payload.progressType.toLowerCase()}-${Date.now()}.webp`);
    formData.append("latitude", String(payload.latitude));
    formData.append("longitude", String(payload.longitude));
    formData.append("accuracy", String(payload.accuracy));
    formData.append("device_timestamp", payload.deviceTimestamp);

    await apiClient.post("/tickets/progress-photos", formData, {
      headers: {
        ...buildActorHeaders(actor),
        "Content-Type": "multipart/form-data"
      }
    });

    const locationRecord: TechnicianLocationLog = {
      id: `LOC-${Date.now()}-PHOTO`,
      userId: payload.userId,
      technicianName: technician?.name ?? "Teknisi",
      ticketId: payload.ticketId,
      branch: ticket?.branch ?? technician?.area ?? "Tanpa Branch",
      area: ticket?.branch ?? technician?.area ?? "Tanpa Area",
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy: payload.accuracy,
      calculatedDistanceMeter: Math.round(distance),
      locationStatus: risk.locationStatus,
      needsReview: risk.locationStatus === "suspicious",
      riskScore: risk.riskScore,
      riskReasons: risk.riskReasons,
      sourceType: "photo_capture",
      createdAt: new Date().toISOString()
    };

    set({
      progressPhotos: [
        record,
        ...get().progressPhotos.filter(
          (item) => !(item.ticketId === payload.ticketId && item.userId === payload.userId && item.progressType === payload.progressType)
        )
      ],
      locationLogs: [locationRecord, ...get().locationLogs]
    });

    return record;
  },
  getLatestLocations: () => {
    const unique = new Map<string, TechnicianLocationLog>();
    for (const log of get().locationLogs) {
      if (!unique.has(log.userId)) {
        unique.set(log.userId, log);
      }
    }
    return Array.from(unique.values());
  }
}));
