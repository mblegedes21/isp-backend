"use client";

import { useMemo, useState } from "react";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface AttendanceActionsProps {
  statusLabel?: string;
  checkInTime?: string;
  checkOutTime?: string;
  latitude?: number | null;
  longitude?: number | null;
  area?: string;
  photoPreview?: string | null;
  onTakePhoto?: () => void;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  disableCheckIn?: boolean;
  disableCheckOut?: boolean;
}

export function AttendanceActions(props: AttendanceActionsProps = {}) {
  const checkedInStore = useAttendanceStore((state) => state.checkedIn);
  const checkedOutStore = useAttendanceStore((state) => state.checkedOut);
  const statusTextStore = useAttendanceStore((state) => state.statusText);
  const history = useAttendanceStore((state) => state.history);

  const [fallbackPhoto, setFallbackPhoto] = useState<string | null>(null);

  const todayRecord = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return history.find((item) => item.date === today);
  }, [history]);

  const mapStatus: Record<string, string> = {
    "Not checked in": "Belum Check In",
    "Checked in": "Sudah Check In",
    "Checked out": "Sudah Check Out"
  };

  const onCheckOut = () => {
    if (props.onCheckOut) {
      props.onCheckOut();
    }
  };

  const onCheckIn = () => {
    if (props.onCheckIn) {
      props.onCheckIn();
    }
  };

  const onTakePhoto = () => {
    if (props.onTakePhoto) {
      props.onTakePhoto();
      return;
    }
    setFallbackPhoto("/mock/leader-selfie.jpg");
  };

  const statusLabel = props.statusLabel ?? mapStatus[statusTextStore] ?? statusTextStore;
  const checkInTime = props.checkInTime ?? todayRecord?.checkInAt ?? "-";
  const checkOutTime = props.checkOutTime ?? todayRecord?.checkOutAt ?? "-";
  const latitude = props.latitude ?? -6.2088;
  const longitude = props.longitude ?? 106.8456;
  const area = props.area ?? "Jakarta Selatan";
  const photoPreview = props.photoPreview ?? fallbackPhoto;
  const disableCheckIn = props.disableCheckIn ?? checkedInStore;
  const disableCheckOut = props.disableCheckOut ?? (!checkedInStore || checkedOutStore);

  return (
    <div className="space-y-4">
      <Card title="Status Absensi Hari Ini">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-md border border-gray-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
            <p className="mt-1 text-lg font-bold">{statusLabel}</p>
          </div>
          <div className="rounded-md border border-gray-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Jam Masuk</p>
            <p className="mt-1 text-lg font-bold">{checkInTime}</p>
          </div>
          <div className="rounded-md border border-gray-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Jam Pulang</p>
            <p className="mt-1 text-lg font-bold">{checkOutTime}</p>
          </div>
        </div>
      </Card>

      <Card title="Aksi Absensi">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button onClick={onCheckIn} disabled={disableCheckIn}>Check In</Button>
          <Button variant="secondary" onClick={onCheckOut} disabled={disableCheckOut}>Check Out</Button>
        </div>
        {disableCheckOut ? <p className="mt-2 text-xs text-danger">Check Out hanya tersedia setelah Check In.</p> : null}
      </Card>

      <Card title="Verifikasi Lokasi">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-md border border-gray-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Latitude</p>
            <p className="mt-1 text-lg font-bold">{latitude}</p>
          </div>
          <div className="rounded-md border border-gray-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Longitude</p>
            <p className="mt-1 text-lg font-bold">{longitude}</p>
          </div>
          <div className="rounded-md border border-gray-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Area</p>
            <p className="mt-1 text-lg font-bold">{area}</p>
          </div>
        </div>
      </Card>

      <Card title="Verifikasi Selfie">
        <div className="space-y-3">
          <Button variant="secondary" onClick={onTakePhoto}>Take Photo</Button>
          {photoPreview ? (
            <div className="rounded-md border border-gray-200 p-2">
              <p className="mb-2 text-sm font-semibold">Preview Photo</p>
              <img src={photoPreview} alt="Preview selfie" className="h-40 w-40 rounded-md object-cover" />
            </div>
          ) : (
            <p className="text-sm text-gray-600">Belum ada foto selfie.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
