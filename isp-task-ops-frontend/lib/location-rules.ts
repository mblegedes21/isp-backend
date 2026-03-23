import type { LocationStatus, ProgressType, TechnicianLocationLog } from "@/types/tracking";

export const PROGRESS_RADIUS_RULES: Record<ProgressType, number> = {
  MENUJU_LOKASI: 1000,
  MULAI_PEKERJAAN: 150,
  TESTING: 150,
  SELESAI: 200
};

export function haversineDistanceMeter(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadius = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function evaluateLocationRisk({
  accuracy,
  distance,
  previousLogs,
  latitude,
  longitude,
  assignedArea,
  ticketArea,
  progressType
}: {
  accuracy: number;
  distance: number;
  previousLogs: TechnicianLocationLog[];
  latitude: number;
  longitude: number;
  assignedArea?: string;
  ticketArea?: string;
  progressType?: ProgressType;
}) {
  let riskScore = 0;
  const riskReasons: string[] = [];

  if (accuracy > 100) {
    riskScore += 20;
    riskReasons.push("Akurasi GPS di atas 100 meter");
  }

  if (distance > 0 && progressType) {
    const radius = PROGRESS_RADIUS_RULES[progressType];
    if (distance > radius) {
      riskScore += 30;
      riskReasons.push(`Jarak melebihi radius ${radius} meter`);
    }
  }

  const recentLog = previousLogs[0];
  if (recentLog) {
    const seconds = Math.max(1, (Date.now() - new Date(recentLog.createdAt).getTime()) / 1000);
    const jumpDistance = haversineDistanceMeter(recentLog.latitude, recentLog.longitude, latitude, longitude);
    const speedKmh = (jumpDistance / 1000) / (seconds / 3600);

    if (speedKmh > 120) {
      riskScore += 25;
      riskReasons.push("Pergerakan tidak realistis");
    }

    if (jumpDistance > 10000 && seconds < 300) {
      riskScore += 20;
      riskReasons.push("Lonjakan lokasi terdeteksi");
    }

    const repeated = previousLogs.filter((log) => log.latitude === latitude && log.longitude === longitude).length;
    if (repeated >= 3) {
      riskScore += 10;
      riskReasons.push("Koordinat yang sama berulang");
    }
  }

  if (assignedArea && ticketArea && assignedArea !== ticketArea) {
    riskScore += 15;
    riskReasons.push("Lokasi berada di luar area assignment");
  }

  const locationStatus: LocationStatus =
    riskScore >= 80 ? "rejected" :
    riskScore >= 50 ? "suspicious" :
    riskScore >= 20 ? "warning" :
    "valid";

  return { riskScore, riskReasons, locationStatus };
}
