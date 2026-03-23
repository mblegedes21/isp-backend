"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { LiveCameraCapture } from "@/components/tracking/LiveCameraCapture";
import { PROGRESS_RADIUS_RULES, evaluateLocationRisk, haversineDistanceMeter } from "@/lib/location-rules";
import { useAuthStore } from "@/store/useAuthStore";
import { useTicketStore } from "@/store/useTicketStore";
import { useStockStore } from "@/store/useStockStore";
import { useTrackingStore } from "@/store/useTrackingStore";
import { TICKET_STATUS_ORDER, type TicketStatus } from "@/types/ticket";
import type { ProgressType } from "@/types/tracking";

const statusLabel: Record<string, string> = {
  ASSIGNED: "Belum Dikerjakan",
  MATERIAL_PREPARED: "Belum Dikerjakan",
  IN_PROGRESS: "Sedang Dikerjakan",
  ESCALATED: "Belum Selesai",
  COMPLETED: "Selesai",
  PENDING_MANAGER_REVIEW: "Menunggu Review Leader",
  CLOSED: "Selesai",
  CLOSED_WITH_LOSS: "Selesai"
};

const progressSteps: Array<{ label: string; type: ProgressType }> = [
  { label: "Menuju Lokasi", type: "MENUJU_LOKASI" },
  { label: "Mulai Pekerjaan", type: "MULAI_PEKERJAAN" },
  { label: "Testing", type: "TESTING" },
  { label: "Selesai", type: "SELESAI" }
];

export default function TechnicianTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const tickets = useTicketStore((state) => state.tickets);
  const transitionStatus = useTicketStore((state) => state.transitionStatus);
  const items = useStockStore((state) => state.items);
  const requests = useStockStore((state) => state.ticketMaterialRequests);
  const assignedTechnicianMaterials = useStockStore((state) => state.assignedTechnicianMaterials);
  const requestTicketMaterials = useStockStore((state) => state.requestTicketMaterials);
  const fetchTicketMaterials = useStockStore((state) => state.fetchTicketMaterials);
  const fetchAssignedTechnicianMaterials = useStockStore((state) => state.fetchAssignedTechnicianMaterials);
  const materialReports = useStockStore((state) => state.materialReports);
  const submitMaterialReport = useStockStore((state) => state.submitMaterialReport);
  const locationLogs = useTrackingStore((state) => state.locationLogs);
  const progressPhotos = useTrackingStore((state) => state.progressPhotos);
  const updateTechnicianLocation = useTrackingStore((state) => state.updateTechnicianLocation);
  const submitProgressPhoto = useTrackingStore((state) => state.submitProgressPhoto);
  const user = useAuthStore((state) => state.user);

  const [activeStep, setActiveStep] = useState<ProgressType>("MENUJU_LOKASI");
  const [additionalMaterialId, setAdditionalMaterialId] = useState("");
  const [additionalQty, setAdditionalQty] = useState(1);
  const [gps, setGps] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [materialForm, setMaterialForm] = useState<Record<string, { used: number; remaining: number; photoFile: File | null; photoPreview: string; existingPhotoPath: string }>>({});
  const [message, setMessage] = useState("");

  const ticket = tickets.find((item) => item.id === params.id);
  const technicianId = ticket?.technicianId ?? user?.id ?? "";
  const technicianName = ticket?.assignee || user?.name || "Teknisi";

  const materialRows = useMemo(() => {
    return assignedTechnicianMaterials.map((item) => ({
      materialId: item.materialId,
      material: item.materialName,
      quantityAssigned: item.quantityAssigned,
      currentStock: item.currentStock,
      unit: items.find((stockItem) => stockItem.id === item.materialId)?.unit ?? "unit",
    }));
  }, [assignedTechnicianMaterials, items]);

  const requestRows = useMemo(() => {
    return requests
      .filter((item) => item.ticketId === ticket?.id)
      .map((item) => ({
        id: item.id,
        material: item.materialName ?? items.find((stockItem) => stockItem.id === item.materialId)?.materialName ?? items.find((stockItem) => stockItem.id === item.materialId)?.name ?? item.materialId,
        quantity: item.qtyRequested,
        status: item.status ?? "PENDING",
        unit: item.unit ?? items.find((stockItem) => stockItem.id === item.materialId)?.unit ?? "unit",
      }));
  }, [items, requests, ticket?.id]);

  const latestLogs = useMemo(
    () => locationLogs.filter((item) => item.userId === technicianId && item.ticketId === ticket?.id).slice(0, 5),
    [locationLogs, technicianId, ticket?.id]
  );

  const activePhoto = useMemo(
    () => progressPhotos.find((photo) => photo.ticketId === ticket?.id && photo.userId === technicianId && photo.progressType === activeStep),
    [activeStep, progressPhotos, technicianId, ticket?.id]
  );

  const savedMaterialReportMap = useMemo(() => {
    return materialReports
      .filter((item) => item.ticketId === ticket?.id && item.technicianId === technicianId)
      .reduce<Record<string, (typeof materialReports)[number]>>((accumulator, item) => {
        accumulator[item.materialId] = item;
        return accumulator;
      }, {});
  }, [materialReports, technicianId, ticket?.id]);

  const latestGeoStatus = useMemo(() => {
    if (!ticket || !gps || !ticket.ticketLatitude || !ticket.ticketLongitude) {
      return null;
    }

    const distance = haversineDistanceMeter(ticket.ticketLatitude, ticket.ticketLongitude, gps.latitude, gps.longitude);
    return evaluateLocationRisk({
      accuracy: gps.accuracy,
      distance,
      previousLogs: latestLogs,
      latitude: gps.latitude,
      longitude: gps.longitude,
      assignedArea: ticket.branch,
      ticketArea: ticket.branch,
      progressType: activeStep
    });
  }, [activeStep, gps, latestLogs, ticket]);

  useEffect(() => {
    if (!ticket || !navigator.geolocation) return;

    const pushLocation = async (sourceType: "heartbeat" | "progress") => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const nextGps = {
            latitude: Number(position.coords.latitude.toFixed(6)),
            longitude: Number(position.coords.longitude.toFixed(6)),
            accuracy: Number(position.coords.accuracy.toFixed(1))
          };
          setGps(nextGps);
          await updateTechnicianLocation({
            userId: technicianId,
            technicianName,
            ticketId: ticket.id,
            latitude: nextGps.latitude,
            longitude: nextGps.longitude,
            accuracy: nextGps.accuracy,
            sourceType
          });
        },
        () => {
          setMessage("GPS belum tersedia. Aktifkan izin lokasi untuk validasi radius.");
        }
      );
    };

    pushLocation("progress");
    const timer = window.setInterval(() => pushLocation("heartbeat"), 30000);
    return () => window.clearInterval(timer);
  }, [technicianId, technicianName, ticket, updateTechnicianLocation]);

  useEffect(() => {
    if (!ticket) return;

    void Promise.all([
      fetchAssignedTechnicianMaterials(ticket.id),
      fetchTicketMaterials(ticket.id),
    ]).catch((error) => {
      setMessage(error instanceof Error ? error.message : "Gagal memuat data material teknisi.");
    });
  }, [fetchAssignedTechnicianMaterials, fetchTicketMaterials, ticket]);

  useEffect(() => {
    setMaterialForm((current) => {
      const nextEntries = materialRows.map((row) => {
        const currentEntry = current[row.materialId];
        const savedEntry = savedMaterialReportMap[row.materialId];

        return [
          row.materialId,
          {
            used: currentEntry?.used ?? savedEntry?.used ?? 0,
            remaining: currentEntry?.remaining ?? savedEntry?.remaining ?? 0,
            photoFile: currentEntry?.photoFile ?? null,
            photoPreview: currentEntry?.photoPreview ?? savedEntry?.photoPath ?? "",
            existingPhotoPath: currentEntry?.existingPhotoPath ?? savedEntry?.photoPath ?? "",
          }
        ] as const;
      });

      return Object.fromEntries(nextEntries);
    });
  }, [materialRows, savedMaterialReportMap]);

  const onCapturePhoto = async (payload: { fileName: string; previewUrl: string; sizeKb: number; deviceTimestamp: string; blob: Blob }) => {
    if (!ticket || !gps) {
      setMessage("Ambil GPS terlebih dahulu sebelum mengambil foto live.");
      return;
    }

    const record = await submitProgressPhoto({
      ticketId: ticket.id,
      userId: technicianId,
      progressType: activeStep,
      imagePath: payload.previewUrl,
      imageSizeKb: payload.sizeKb,
      latitude: gps.latitude,
      longitude: gps.longitude,
      accuracy: gps.accuracy,
      imageBlob: payload.blob,
      deviceTimestamp: payload.deviceTimestamp
    });

    await updateTechnicianLocation({
      userId: technicianId,
      technicianName,
      ticketId: ticket.id,
      latitude: gps.latitude,
      longitude: gps.longitude,
      accuracy: gps.accuracy,
      sourceType: "photo_capture"
    });

    setMessage(
      record.locationStatus === "valid"
        ? `Foto tahap ${progressSteps.find((step) => step.type === activeStep)?.label} tersimpan.`
        : `Foto tersimpan dengan status ${record.locationStatus}. Data akan ditinjau leader dan manager.`
    );
  };

  const onRequestAdditionalMaterial = async () => {
    if (!ticket || !additionalMaterialId) {
      setMessage("Pilih material tambahan terlebih dahulu.");
      return;
    }

    try {
      await requestTicketMaterials(ticket.id, [{ materialId: additionalMaterialId, quantity: additionalQty, technicianId }]);
      await fetchTicketMaterials(ticket.id);
      await fetchAssignedTechnicianMaterials(ticket.id);
      setMessage("Permintaan material tambahan berhasil dikirim ke gudang.");
      setAdditionalMaterialId("");
      setAdditionalQty(1);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal mengirim permintaan material tambahan.");
    }
  };

  const onChangeMaterialValue = (materialId: string, field: "used" | "remaining", value: number) => {
    setMaterialForm((current) => ({
      ...current,
      [materialId]: {
        used: current[materialId]?.used ?? 0,
        remaining: current[materialId]?.remaining ?? 0,
        photoFile: current[materialId]?.photoFile ?? null,
        photoPreview: current[materialId]?.photoPreview ?? "",
        existingPhotoPath: current[materialId]?.existingPhotoPath ?? "",
        [field]: Math.max(0, value),
      }
    }));
  };

  const onSelectMaterialPhoto = (materialId: string, file: File | null) => {
    setMaterialForm((current) => ({
      ...current,
      [materialId]: {
        used: current[materialId]?.used ?? 0,
        remaining: current[materialId]?.remaining ?? 0,
        photoFile: file,
        photoPreview: file ? URL.createObjectURL(file) : current[materialId]?.photoPreview ?? "",
        existingPhotoPath: file ? "" : current[materialId]?.existingPhotoPath ?? "",
      }
    }));
  };

  const onSubmitJob = async () => {
    if (!ticket) {
      setMessage("Ticket tidak ditemukan.");
      return;
    }

    const missingStage = progressSteps.find(
      (step) => !progressPhotos.some((photo) => photo.ticketId === ticket.id && photo.userId === technicianId && photo.progressType === step.type)
    );

    if (missingStage) {
      setMessage(`Foto live untuk tahap ${missingStage.label} masih wajib diambil.`);
      return;
    }

    if (!gps) {
      setMessage("GPS wajib aktif sebelum submit pekerjaan.");
      return;
    }

    if (materialRows.length === 0) {
      setMessage("Belum ada material tugas yang terdaftar untuk tiket ini.");
      return;
    }

    const invalidMaterial = materialRows.find((row) => {
      const entry = materialForm[row.materialId];
      if (!entry) return true;
      if (entry.used < 0 || entry.remaining < 0) return true;
      if (entry.used + entry.remaining > row.quantityAssigned) return true;
      if (!entry.photoFile && !entry.existingPhotoPath) return true;
      return false;
    });

    if (invalidMaterial) {
      setMessage(`Periksa kembali laporan material ${invalidMaterial.material}. Jumlah digunakan dan sisa tidak boleh melebihi material tugas, dan foto wajib ada.`);
      return;
    }

    await submitMaterialReport({
      ticketId: ticket.id,
      technicianId,
      materials: materialRows.map((row) => {
        const entry = materialForm[row.materialId];
        return {
          materialId: row.materialId,
          used: entry?.used ?? 0,
          remaining: entry?.remaining ?? 0,
          photo: entry?.photoFile ?? null,
          existingPhotoPath: entry?.existingPhotoPath ?? "",
        };
      }),
      latitude: gps.latitude,
      longitude: gps.longitude,
      accuracy: gps.accuracy
    });

    let currentStatus: TicketStatus = ticket.status;
    const targetStatus: TicketStatus = "PENDING_MANAGER_REVIEW";

    while (currentStatus !== targetStatus) {
      const currentIndex = TICKET_STATUS_ORDER.indexOf(currentStatus);
      const nextStatus = TICKET_STATUS_ORDER[currentIndex + 1];

      if (!nextStatus) {
        setMessage("Status tiket tidak dapat dilanjutkan ke Menunggu Review Leader.");
        return;
      }

      const result = await transitionStatus(ticket.id, nextStatus);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      currentStatus = nextStatus;
    }

    setMessage("Pekerjaan berhasil dikirim. Leader dan manager akan meninjau bukti GPS dan foto live.");
  };

  if (!ticket) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-danger">Ticket tidak ditemukan.</p>
        <Link className="text-sm font-semibold text-accent underline" href="/dashboard/technician/tickets">
          Kembali ke Ticket Saya
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link className="text-sm font-semibold text-accent underline" href="/dashboard/technician/tickets">
        Kembali ke Ticket Saya
      </Link>

      <Card title="Detail Ticket">
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-gray-500">Ticket ID</p>
            <p className="font-semibold">{ticket.id}</p>
          </div>
          <div>
            <p className="text-gray-500">Area</p>
            <p className="font-semibold">{ticket.branch}</p>
          </div>
          <div>
            <p className="text-gray-500">Lokasi Tiket</p>
            <p className="font-semibold">
              {ticket.ticketLatitude?.toFixed(6)}, {ticket.ticketLongitude?.toFixed(6)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Radius Default Tahap</p>
            <p className="font-semibold">{PROGRESS_RADIUS_RULES[activeStep]} meter</p>
          </div>
          <div>
            <p className="text-gray-500">Jenis Gangguan</p>
            <p className="font-semibold">{ticket.problemType}</p>
          </div>
          <div>
            <p className="text-gray-500">Status</p>
            <p className="font-semibold">{statusLabel[ticket.status] ?? ticket.status}</p>
          </div>
        </div>
      </Card>

      <Card title="Material Tugas">
        <Table
          data={materialRows}
          emptyText="Belum ada material yang dikeluarkan untuk teknisi pada tiket ini."
          searchableKeys={["material", "quantityAssigned", "currentStock", "unit"]}
          columns={[
            { header: "Material", key: "material", render: (row) => row.material },
            { header: "Assigned", key: "quantityAssigned", render: (row) => row.quantityAssigned },
            { header: "Current Stock", key: "currentStock", render: (row) => row.currentStock },
            { header: "Unit", key: "unit", render: (row) => row.unit },
          ]}
        />
      </Card>

      <Card title="Permintaan Material Tambahan">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_140px_auto]">
          <select
            className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            value={additionalMaterialId}
            onChange={(event) => setAdditionalMaterialId(event.target.value)}
          >
            <option value="">Pilih Material</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.materialName ?? item.name} - stok {item.quantity} {item.unit}
              </option>
            ))}
          </select>

          <input
            type="number"
            min={1}
            className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            value={additionalQty}
            onChange={(event) => setAdditionalQty(Number(event.target.value))}
          />

          <Button type="button" onClick={() => void onRequestAdditionalMaterial()}>
            Ajukan Material
          </Button>
        </div>

        <div className="mt-4">
          <Table
            data={requestRows}
            emptyText="Belum ada permintaan material tambahan untuk tiket ini."
            searchableKeys={["material", "quantity", "status", "unit"]}
            columns={[
              { header: "Material", key: "material", render: (row) => row.material },
              { header: "Quantity", key: "quantity", render: (row) => `${row.quantity} ${row.unit}` },
              { header: "Status", key: "status", render: (row) => row.status },
            ]}
          />
        </div>
      </Card>

      <Card title="Tahap Progress">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {progressSteps.map((step) => {
            const exists = progressPhotos.some((photo) => photo.ticketId === ticket.id && photo.userId === technicianId && photo.progressType === step.type);
            return (
              <Button
                key={step.type}
                variant={activeStep === step.type ? "primary" : "secondary"}
                className="w-full text-sm"
                onClick={() => setActiveStep(step.type)}
              >
                {step.label}{exists ? " | OK" : ""}
              </Button>
            );
          })}
        </div>
      </Card>

      <Card title="GPS Validasi">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm font-semibold text-gray-900">Lokasi Teknisi Saat Ini</p>
            <p className="mt-2 text-sm text-gray-600">
              {gps ? `${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)} | Akurasi ${gps.accuracy} m` : "Menunggu pembacaan GPS perangkat"}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm font-semibold text-gray-900">Hasil Validasi Radius</p>
            <p className="mt-2 text-sm text-gray-600">
              {latestGeoStatus
                ? `Status ${latestGeoStatus.locationStatus} | Risk ${latestGeoStatus.riskScore}`
                : "Validasi akan muncul setelah GPS terbaca."}
            </p>
            {latestGeoStatus?.riskReasons.length ? (
              <p className="mt-2 text-xs text-amber-700">{latestGeoStatus.riskReasons.join(", ")}</p>
            ) : null}
          </div>
        </div>
      </Card>

      <Card title="Foto Progress Live">
        <div className="space-y-4">
          <LiveCameraCapture
            label={progressSteps.find((step) => step.type === activeStep)?.label ?? activeStep}
            onCapture={onCapturePhoto}
          />

          {activePhoto ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
              <p className="font-semibold text-gray-900">Metadata Server-Side</p>
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                <p>captured_at_server: {new Date(activePhoto.capturedAtServer).toLocaleString("id-ID")}</p>
                <p>uploaded_at_server: {new Date(activePhoto.uploadedAtServer).toLocaleString("id-ID")}</p>
                <p>progress_type: {activePhoto.progressType}</p>
                <p>distance: {activePhoto.calculatedDistanceMeter} meter</p>
                <p>location_status: {activePhoto.locationStatus}</p>
                <p>risk_score: {activePhoto.riskScore}</p>
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <Card title="Laporan Material">
        <div className="space-y-4">
          {materialRows.length === 0 ? (
            <p className="text-sm text-gray-600">Material akan muncul otomatis setelah gudang mengeluarkan material untuk teknisi.</p>
          ) : (
            materialRows.map((row) => {
              const entry = materialForm[row.materialId] ?? {
                used: 0,
                remaining: 0,
                photoFile: null,
                photoPreview: "",
                existingPhotoPath: ""
              };
              const totalReported = entry.used + entry.remaining;
              const isInvalid = totalReported > row.quantityAssigned;

              return (
                <div key={row.materialId} className="rounded-xl border border-app-border bg-white p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{row.material}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Assigned: {row.quantityAssigned} {row.unit} | Current stock: {row.currentStock} {row.unit}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label>
                        <p className="mb-1 text-sm font-semibold">Quantity Used</p>
                        <input
                          type="number"
                          min={0}
                          className="w-full rounded-xl border border-app-border bg-white/90 px-4 py-3 text-sm text-app-text outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                          value={entry.used}
                          onChange={(event) => onChangeMaterialValue(row.materialId, "used", Number(event.target.value))}
                        />
                      </label>
                      <label>
                        <p className="mb-1 text-sm font-semibold">Quantity Remaining</p>
                        <input
                          type="number"
                          min={0}
                          className="w-full rounded-xl border border-app-border bg-white/90 px-4 py-3 text-sm text-app-text outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                          value={entry.remaining}
                          onChange={(event) => onChangeMaterialValue(row.materialId, "remaining", Number(event.target.value))}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
                    <p className="mb-2 text-sm font-semibold text-slate-900">Photo Evidence</p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="block w-full text-sm text-slate-700"
                      onChange={(event) => onSelectMaterialPhoto(row.materialId, event.target.files?.[0] ?? null)}
                    />

                    {entry.photoPreview ? (
                      <img
                        src={entry.photoPreview}
                        alt={`Bukti ${row.material}`}
                        className="mt-3 h-44 w-full rounded-lg object-cover"
                      />
                    ) : null}
                  </div>

                  <div className={`mt-3 rounded-lg px-3 py-2 text-sm ${isInvalid ? "border border-amber-300 bg-amber-50 text-amber-900" : "border border-slate-200 bg-slate-50 text-slate-700"}`}>
                    Total reported: {totalReported} / {row.quantityAssigned} {row.unit}
                    {isInvalid ? " | Quantity used + remaining melebihi material yang ditugaskan." : ""}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Button className="w-full" onClick={onSubmitJob}>Submit Pekerjaan</Button>
      {message ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          {message}
        </div>
      ) : null}
    </div>
  );
}
