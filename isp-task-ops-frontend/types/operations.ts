export interface TechnicianJobStats {
  installODP: number;
  repairFiber: number;
  replaceConnector: number;
  installONT: number;
  maintenance: number;
}

export interface LeaderOption {
  id: string;
  name: string;
  area: string;
}

export interface TechnicianProfile {
  id: string;
  name: string;
  area: string;
  leaderId: string;
  completedToday: number;
  averageRepairHours: number;
  escalationCount: number;
  bonusEligibleJobs: number;
  status: "AKTIF" | "SIAGA" | "OFFLINE";
  jobStats: TechnicianJobStats;
}

export interface AreaBaseline {
  areaId: string;
  areaName: string;
  averageRepairHours: number;
  repeatFaults: number;
  slaCompliance: number;
}

export interface AreaOperationalMetric {
  areaId: string;
  areaName: string;
  openTickets: number;
  escalatedTickets: number;
  slaCompliance: number;
  averageRepairHours: number;
  activeTechnicians: number;
  materialUsageToday: number;
  repeatFaults: number;
}

export interface AuditLogItem {
  id: string;
  createdAt: string;
  user: string;
  actionType: string;
  entityType: string;
  entityId: string;
  before: string;
  after: string;
  source: string;
  reviewStatus: "BARU" | "DITANDAI" | "KLARIFIKASI" | "DIINVESTIGASI" | "SELESAI";
}

export interface IncidentAlert {
  id: string;
  areaId: string;
  areaName: string;
  severity: "SEDANG" | "TINGGI" | "KRITIS";
  ticketCount: number;
  escalationCount: number;
  detectedAt: string;
  responseStatus: "TERDETEKSI" | "DALAM_RESPON" | "DIKOMUNIKASIKAN" | "SELESAI";
}

export interface ManagerActionItem {
  id: string;
  title: string;
  description: string;
  severity: "INFO" | "PERINGATAN" | "KRITIS";
  targetSection: string;
  ctaLabel: string;
}

export interface AreaActionRecord {
  id: string;
  areaName: string;
  action: string;
  createdAt: string;
}
