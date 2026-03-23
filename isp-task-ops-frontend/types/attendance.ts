export interface AttendanceRecord {
  id: string;
  flagId?: string | null;
  userId?: string;
  technicianName?: string;
  area?: string;
  leaderName?: string;
  date: string;
  checkInAt?: string;
  checkOutAt?: string;
  gps?: string;
  photo?: string;
  photoPath?: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  flagged: boolean;
  flagType?: "TERLAMBAT" | "TIDAK_CHECK_OUT" | "TIDAK_HADIR" | "LOKASI_TIDAK_SESUAI";
  reviewStatus?: "BELUM_DITINJAU" | "MENUNGGU_PENJELASAN" | "PERINGATAN_TERKIRIM" | "LEADER_DINOTIFIKASI" | "SELESAI";
}

export interface AttendanceState {
  currentDate: string;
  checkedIn: boolean;
  checkedOut: boolean;
}
