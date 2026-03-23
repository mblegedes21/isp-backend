"use client";

import { useEffect } from "react";
import { apiClient, buildActorHeaders, getAuthToken } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useManagerStore } from "@/store/useManagerStore";
import { useStockStore } from "@/store/useStockStore";
import { useTicketStore } from "@/store/useTicketStore";
import { useTrackingStore } from "@/store/useTrackingStore";

export function AuthBootstrap() {
  const enforceTokenExpiry = useAuthStore((state) => state.enforceTokenExpiry);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    void enforceTokenExpiry();
    const timer = window.setInterval(() => {
      void enforceTokenExpiry();
    }, 30000);
    return () => clearInterval(timer);
  }, [enforceTokenExpiry]);

  useEffect(() => {
    const resolvedToken = token ?? getAuthToken();

    if (!hydrated || !user || !isAuthenticated() || !resolvedToken) {
      return;
    }

    const hydrate = async () => {
      try {
        const headers = buildActorHeaders(user);

        console.log("AuthBootstrap token:", resolvedToken);
        console.log("AuthBootstrap request headers:", headers);

        if (!("Authorization" in headers) || !headers.Authorization) {
          return;
        }

        const { data } = await apiClient.get("/api/app-state", {
          headers,
        });
        const today = new Date().toISOString().slice(0, 10);
        const todayAttendance = (data?.attendanceHistory ?? []).find(
          (item: { date?: string; userId?: string; checkInAt?: string; checkOutAt?: string }) =>
            item.date === today && item.userId === user.id
        );

        useTicketStore.setState((state) => ({
          ...state,
          tickets: Array.isArray(data?.tickets) ? data.tickets : [],
          escalations: Array.isArray(data?.tickets)
            ? data.tickets.flatMap((ticket: { escalations?: unknown[] }) => ticket.escalations ?? [])
            : [],
          leaders: Array.isArray(data?.leaders) ? data.leaders : [],
          technicians: Array.isArray(data?.technicians) ? data.technicians : []
        }));
        useAttendanceStore.setState((state) => ({
          ...state,
          history: Array.isArray(data?.attendanceHistory) ? data.attendanceHistory : [],
          checkedIn: Boolean(todayAttendance?.checkInAt),
          checkedOut: Boolean(todayAttendance?.checkOutAt),
          statusText: todayAttendance?.checkOutAt ? "Checked out" : todayAttendance?.checkInAt ? "Checked in" : "Not checked in"
        }));
        useStockStore.setState((state) => ({
          ...state,
          items: Array.isArray(data?.stockItems) ? data.stockItems : [],
          categories: Array.isArray(data?.materialCategories)
            ? data.materialCategories.map((item: { id: string | number; name?: string; description?: string | null }) => ({
                id: String(item.id),
                name: item.name ?? "-",
                description: item.description ?? null
              }))
            : [],
          brands: Array.isArray(data?.materialBrands)
            ? data.materialBrands.map((item: { id: string | number; category_id: string | number; name?: string }) => ({
                id: String(item.id),
                categoryId: String(item.category_id),
                name: item.name ?? "-"
              }))
            : [],
          transactions: Array.isArray(data?.stockTransactions) ? data.stockTransactions : [],
          purchaseRequests: Array.isArray(data?.purchaseRequests) ? data.purchaseRequests : [],
          stockAudits: Array.isArray(data?.stockAudits) ? data.stockAudits : [],
          transfers: Array.isArray(data?.stockTransfers) ? data.stockTransfers : [],
          losses: Array.isArray(data?.lossReports) ? data.lossReports : [],
          ticketMaterialRequests: Array.isArray(data?.ticketMaterialRequests) ? data.ticketMaterialRequests : [],
          materialReports: Array.isArray(data?.materialReports) ? data.materialReports : []
        }));
        useTrackingStore.setState({
          locationLogs: Array.isArray(data?.locationLogs) ? data.locationLogs : [],
          progressPhotos: Array.isArray(data?.progressPhotos) ? data.progressPhotos : []
        });
        useManagerStore.setState({
          auditLogs: Array.isArray(data?.auditLogs) ? data.auditLogs : [],
          incidents: Array.isArray(data?.incidents) ? data.incidents : [],
          areaActions: Array.isArray(data?.areaActions) ? data.areaActions : []
        });
      } catch (error) {
        console.error("AuthBootstrap hydration error", error);
      }
    };

    void hydrate();
  }, [hydrated, isAuthenticated, token, user]);

  return null;
}
