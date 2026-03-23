"use client";

import { useMemo, useState } from "react";
import { AttendanceActions } from "@/components/attendance/AttendanceActions";
import { AttendanceHistory, type LeaderAttendanceHistoryItem } from "@/components/attendance/AttendanceHistory";

const formatTime = () =>
  new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

const formatDate = (date: Date) =>
  date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

export default function LeaderAttendancePage() {
  const [status, setStatus] = useState<"Belum Check In" | "Sudah Check In" | "Sudah Check Out">("Belum Check In");
  const [checkInTime, setCheckInTime] = useState<string>("-");
  const [checkOutTime, setCheckOutTime] = useState<string>("-");
  const [latitude, setLatitude] = useState<number>(-6.2088);
  const [longitude, setLongitude] = useState<number>(106.8456);
  const [area, setArea] = useState<string>("Jakarta Selatan");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [historyRows, setHistoryRows] = useState<LeaderAttendanceHistoryItem[]>([
    { tanggal: "10 Mar 2026", checkIn: "08:03", checkOut: "17:10", lokasi: "Jakarta Selatan" }
  ]);

  const disableCheckIn = status !== "Belum Check In" || !photoPreview;
  const disableCheckOut = status !== "Sudah Check In";

  const lokasiLabel = useMemo(() => `${latitude}, ${longitude}`, [latitude, longitude]);

  const onTakePhoto = () => {
    setPhotoPreview("/mock/leader-selfie.jpg");
  };

  const onCheckIn = () => {
    if (!photoPreview) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(Number(position.coords.latitude.toFixed(6)));
          setLongitude(Number(position.coords.longitude.toFixed(6)));
          setArea("Jakarta Selatan");
        },
        () => {
          setLatitude(-6.2088);
          setLongitude(106.8456);
          setArea("Jakarta Selatan");
        }
      );
    }

    const nowTime = formatTime();
    setCheckInTime(nowTime);
    setStatus("Sudah Check In");
  };

  const onCheckOut = () => {
    const nowTime = formatTime();
    setCheckOutTime(nowTime);
    setStatus("Sudah Check Out");

    setHistoryRows((prev) => [
      {
        tanggal: formatDate(new Date()),
        checkIn: checkInTime === "-" ? formatTime() : checkInTime,
        checkOut: nowTime,
        lokasi: `${area} (${lokasiLabel})`
      },
      ...prev
    ]);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Absensi Leader</h1>
      {!photoPreview ? <p className="text-sm text-danger">Selfie wajib diambil sebelum Check In.</p> : null}

      <AttendanceActions
        statusLabel={status}
        checkInTime={checkInTime}
        checkOutTime={checkOutTime}
        latitude={latitude}
        longitude={longitude}
        area={area}
        photoPreview={photoPreview}
        onTakePhoto={onTakePhoto}
        onCheckIn={onCheckIn}
        onCheckOut={onCheckOut}
        disableCheckIn={disableCheckIn}
        disableCheckOut={disableCheckOut}
      />

      <AttendanceHistory rows={historyRows} />
    </div>
  );
}
