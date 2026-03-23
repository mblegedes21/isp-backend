"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LiveCameraCapture } from "@/components/tracking/LiveCameraCapture";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useTrackingStore } from "@/store/useTrackingStore";

export default function TechnicianAttendancePage() {
  const checkedIn = useAttendanceStore((state) => state.checkedIn);
  const checkedOut = useAttendanceStore((state) => state.checkedOut);
  const checkIn = useAttendanceStore((state) => state.checkIn);
  const checkOut = useAttendanceStore((state) => state.checkOut);
  const updateTechnicianLocation = useTrackingStore((state) => state.updateTechnicianLocation);
  const user = useAuthStore((state) => state.user);

  const [gps, setGps] = useState("");
  const [gpsPayload, setGpsPayload] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [selfieCheckIn, setSelfieCheckIn] = useState<{ fileName: string; blob: Blob } | null>(null);
  const [selfieCheckOut, setSelfieCheckOut] = useState<{ fileName: string; blob: Blob } | null>(null);
  const [message, setMessage] = useState("");

  const onGetGps = () => {
    if (!navigator.geolocation) {
      setMessage("Perangkat tidak mendukung GPS.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setGpsPayload({
          latitude: Number(lat),
          longitude: Number(lng),
          accuracy: Number(position.coords.accuracy.toFixed(1))
        });
        setGps(`${lat}, ${lng}`);
        setMessage("Lokasi GPS berhasil diambil.");
      },
      () => setMessage("Gagal mengambil GPS. Pastikan izin lokasi aktif.")
    );
  };

  const onCheckIn = async () => {
    if (!gpsPayload || !selfieCheckIn || !user) {
      setMessage("Check In wajib GPS dan foto selfie.");
      return;
    }

    try {
      await checkIn({
        latitude: gpsPayload.latitude,
        longitude: gpsPayload.longitude,
        accuracy: gpsPayload.accuracy,
        photoBlob: selfieCheckIn.blob,
        fileName: selfieCheckIn.fileName
      });
      await updateTechnicianLocation({
        userId: user.id,
        technicianName: user.name,
        latitude: gpsPayload.latitude,
        longitude: gpsPayload.longitude,
        accuracy: gpsPayload.accuracy,
        sourceType: "attendance_check_in"
      });
      setMessage("Check In berhasil.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Check In gagal.");
    }
  };

  const onCheckOut = async () => {
    if (!gpsPayload || !selfieCheckOut || !user) {
      setMessage("Check Out wajib GPS dan foto selfie.");
      return;
    }

    const result = await checkOut({
      latitude: gpsPayload.latitude,
      longitude: gpsPayload.longitude,
      accuracy: gpsPayload.accuracy,
      photoBlob: selfieCheckOut.blob,
      fileName: selfieCheckOut.fileName
    });
    if (result.ok) {
      await updateTechnicianLocation({
        userId: user.id,
        technicianName: user.name,
        latitude: gpsPayload.latitude,
        longitude: gpsPayload.longitude,
        accuracy: gpsPayload.accuracy,
        sourceType: "attendance_check_out"
      });
    }
    setMessage(result.message);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold md:text-2xl">Absensi</h1>

      <Card title="Lokasi GPS">
        <Button className="w-full" onClick={onGetGps}>Ambil Lokasi GPS</Button>
        <p className="mt-2 text-sm text-gray-700">{gps || "Lokasi belum diambil."}</p>
      </Card>

      <Card title="Selfie Check In">
        <LiveCameraCapture
          label="Selfie Check In"
          facingMode="user"
          onCapture={(payload) => setSelfieCheckIn({ fileName: payload.fileName, blob: payload.blob })}
        />
        <p className="mt-2 text-sm text-gray-700">{selfieCheckIn?.fileName || "Foto selfie check in belum dipilih."}</p>
      </Card>

      <Card title="Selfie Check Out">
        <LiveCameraCapture
          label="Selfie Check Out"
          facingMode="user"
          onCapture={(payload) => setSelfieCheckOut({ fileName: payload.fileName, blob: payload.blob })}
        />
        <p className="mt-2 text-sm text-gray-700">{selfieCheckOut?.fileName || "Foto selfie check out belum dipilih."}</p>
      </Card>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button className="w-full" onClick={onCheckIn} disabled={checkedIn}>Check In</Button>
        <Button className="w-full" variant="secondary" onClick={onCheckOut} disabled={!checkedIn || checkedOut}>Check Out</Button>
      </div>

      {message ? <p className="text-sm text-gray-700">{message}</p> : null}
    </div>
  );
}
