export type ProgressType = "MENUJU_LOKASI" | "MULAI_PEKERJAAN" | "TESTING" | "SELESAI";

export type LocationStatus = "valid" | "warning" | "suspicious" | "rejected";

export interface TechnicianLocationLog {
  id: string;
  userId: string;
  technicianName: string;
  ticketId?: string;
  branch: string;
  area: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  calculatedDistanceMeter: number;
  locationStatus: LocationStatus;
  needsReview: boolean;
  riskScore: number;
  riskReasons: string[];
  sourceType: "heartbeat" | "assignment" | "progress" | "photo_capture" | "attendance_check_in" | "attendance_check_out";
  createdAt: string;
}

export interface TicketProgressPhotoRecord {
  id: string;
  ticketId: string;
  userId: string;
  progressType: ProgressType;
  imagePath: string;
  imageSizeKb: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  calculatedDistanceMeter: number;
  locationStatus: LocationStatus;
  needsReview: boolean;
  riskScore: number;
  riskReasons: string[];
  capturedAtServer: string;
  uploadedAtServer: string;
}
