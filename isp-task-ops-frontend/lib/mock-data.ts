import type { AttendanceRecord } from "@/types/attendance";
import type {
  AreaActionRecord,
  AreaBaseline,
  AuditLogItem,
  IncidentAlert,
  LeaderOption,
  TechnicianProfile
} from "@/types/operations";
import type { LossReport, StockItem, TicketMaterialReport, TicketMaterialRequest, TransferRequest } from "@/types/stock";
import type { Ticket } from "@/types/ticket";
import type { TechnicianLocationLog, TicketProgressPhotoRecord } from "@/types/tracking";

const now = new Date();

const isoOffset = (dayOffset: number, hourOffset = 0): string => {
  const value = new Date(now);
  value.setDate(value.getDate() + dayOffset);
  value.setHours(value.getHours() + hourOffset);
  return value.toISOString();
};

const dateOffset = (dayOffset: number): string => {
  const value = new Date(now);
  value.setDate(value.getDate() + dayOffset);
  return value.toISOString().slice(0, 10);
};

export const mockLeaders: LeaderOption[] = [
  { id: "USR-LEADER-1", name: "Budi Santoso", area: "Jakarta Selatan" },
  { id: "USR-LEADER-2", name: "Rina Putri", area: "Bandung" },
  { id: "USR-LEADER-3", name: "Dewi Lestari", area: "Bekasi" }
];

export const mockTechnicians: TechnicianProfile[] = [
  {
    id: "USR-TECH-1",
    name: "Andi",
    area: "Jakarta Selatan",
    leaderId: "USR-LEADER-1",
    completedToday: 4,
    averageRepairHours: 2.6,
    escalationCount: 1,
    bonusEligibleJobs: 12,
    status: "AKTIF",
    jobStats: { installODP: 3, repairFiber: 6, replaceConnector: 9, installONT: 5, maintenance: 4 }
  },
  {
    id: "USR-TECH-2",
    name: "Dina",
    area: "Bandung",
    leaderId: "USR-LEADER-2",
    completedToday: 3,
    averageRepairHours: 3.1,
    escalationCount: 3,
    bonusEligibleJobs: 10,
    status: "AKTIF",
    jobStats: { installODP: 4, repairFiber: 7, replaceConnector: 5, installONT: 3, maintenance: 5 }
  },
  {
    id: "USR-TECH-3",
    name: "Rizky",
    area: "Bekasi",
    leaderId: "USR-LEADER-3",
    completedToday: 2,
    averageRepairHours: 3.8,
    escalationCount: 1,
    bonusEligibleJobs: 8,
    status: "SIAGA",
    jobStats: { installODP: 2, repairFiber: 5, replaceConnector: 6, installONT: 2, maintenance: 6 }
  },
  {
    id: "USR-TECH-4",
    name: "Bima",
    area: "Jakarta Selatan",
    leaderId: "USR-LEADER-1",
    completedToday: 5,
    averageRepairHours: 2.3,
    escalationCount: 0,
    bonusEligibleJobs: 14,
    status: "AKTIF",
    jobStats: { installODP: 5, repairFiber: 3, replaceConnector: 4, installONT: 7, maintenance: 2 }
  },
  {
    id: "USR-TECH-5",
    name: "Nadia",
    area: "Bandung",
    leaderId: "USR-LEADER-2",
    completedToday: 1,
    averageRepairHours: 4.2,
    escalationCount: 2,
    bonusEligibleJobs: 6,
    status: "OFFLINE",
    jobStats: { installODP: 1, repairFiber: 4, replaceConnector: 2, installONT: 1, maintenance: 3 }
  }
];

export const mockTickets: Ticket[] = [
  {
    id: "TCK-1001",
    title: "Fiber Down - Sector 7",
    description: "Koneksi backbone terputus pada ring utama sektor 7.",
    areaId: "AR-JKS",
    ticketLatitude: -6.261492,
    ticketLongitude: 106.810601,
    validRadiusMeter: 150,
    problemType: "FIBER_BACKBONE_DOWN",
    priority: "HIGH",
    createdBy: "USR-NOC-1",
    branch: "Jakarta Selatan",
    assignee: "",
    status: "CREATED",
    estimatedLossPercent: 2.1,
    escalated: false,
    escalationReason: "Fiber backbone putus",
    createdAt: isoOffset(0, -8),
    updatedAt: isoOffset(0, -7)
  },
  {
    id: "TCK-1002",
    title: "Monitoring OLT Node B14",
    description: "Perlu investigasi awal untuk lonjakan alarm pada OLT B14.",
    areaId: "AR-BDG",
    ticketLatitude: -6.902112,
    ticketLongitude: 107.618729,
    validRadiusMeter: 150,
    problemType: "OLT_FAILURE",
    priority: "MEDIUM",
    createdBy: "USR-NOC-2",
    branch: "Bandung",
    assignee: "",
    status: "CREATED",
    estimatedLossPercent: 1.8,
    escalated: false,
    escalationReason: "Menunggu penugasan teknisi",
    createdAt: isoOffset(0, -6),
    updatedAt: isoOffset(0, -5)
  },
  {
    id: "TCK-1003",
    title: "Gangguan OLT Node B12",
    description: "OLT sering restart dan menyebabkan packet loss tinggi.",
    areaId: "AR-BDG",
    ticketLatitude: -6.903221,
    ticketLongitude: 107.611112,
    validRadiusMeter: 150,
    problemType: "OLT_FAILURE",
    priority: "CRITICAL",
    leaderId: "USR-LEADER-2",
    technicianId: "USR-TECH-2",
    createdBy: "USR-NOC-2",
    branch: "Bandung",
    assignee: "Dina",
    status: "ESCALATED",
    estimatedLossPercent: 6.3,
    escalated: true,
    escalationReason: "OLT tidak stabil dan butuh vendor support",
    createdAt: isoOffset(-1, -4),
    updatedAt: isoOffset(0, -1)
  },
  {
    id: "TCK-1004",
    title: "Aktivasi Pelanggan Baru Cluster Anggrek",
    description: "Pemasangan baru menunggu approval manajer karena potensi loss.",
    areaId: "AR-BKS",
    ticketLatitude: -6.241586,
    ticketLongitude: 107.001176,
    validRadiusMeter: 200,
    problemType: "CUSTOMER_VIP",
    priority: "MEDIUM",
    leaderId: "USR-LEADER-3",
    technicianId: "USR-TECH-3",
    createdBy: "USR-NOC-1",
    branch: "Bekasi",
    assignee: "Rizky",
    status: "PENDING_MANAGER_REVIEW",
    estimatedLossPercent: 1.2,
    escalated: false,
    escalationReason: "Potensi loss rendah",
    createdAt: isoOffset(-1, -6),
    updatedAt: isoOffset(0, -2)
  },
  {
    id: "TCK-1005",
    title: "Perbaikan Fiber Backbone Sektor 3",
    description: "Sambungan backbone putus setelah pekerjaan sipil.",
    areaId: "AR-JKS",
    ticketLatitude: -6.260874,
    ticketLongitude: 106.814327,
    validRadiusMeter: 150,
    problemType: "FIBER_BACKBONE_DOWN",
    priority: "HIGH",
    leaderId: "USR-LEADER-1",
    technicianId: "USR-TECH-1",
    createdBy: "USR-NOC-1",
    branch: "Jakarta Selatan",
    assignee: "Andi",
    status: "IN_PROGRESS",
    estimatedLossPercent: 3.7,
    escalated: false,
    escalationReason: "Perlu pengecekan backbone",
    createdAt: isoOffset(-1, -3),
    updatedAt: isoOffset(0, -3)
  },
  {
    id: "TCK-1006",
    title: "Replace Connector Pelanggan Corporate",
    description: "Konektor utama pelanggan korporat perlu diganti.",
    areaId: "AR-JKS",
    ticketLatitude: -6.275441,
    ticketLongitude: 106.801254,
    validRadiusMeter: 200,
    problemType: "CONNECTOR_REPLACEMENT",
    priority: "LOW",
    leaderId: "USR-LEADER-1",
    technicianId: "USR-TECH-4",
    createdBy: "USR-NOC-3",
    branch: "Jakarta Selatan",
    assignee: "Bima",
    status: "COMPLETED",
    estimatedLossPercent: 0.4,
    escalated: false,
    escalationReason: "Penggantian konektor rutin",
    createdAt: isoOffset(-1, -8),
    updatedAt: isoOffset(0, -4)
  },
  {
    id: "TCK-1007",
    title: "Audit ODP Area Bekasi Timur",
    description: "Validasi ODP dan patching pada area pelanggan padat.",
    areaId: "AR-BKS",
    ticketLatitude: -6.225731,
    ticketLongitude: 107.017231,
    validRadiusMeter: 150,
    problemType: "INSTALL_ODP",
    priority: "LOW",
    leaderId: "USR-LEADER-3",
    technicianId: "USR-TECH-3",
    createdBy: "USR-NOC-1",
    branch: "Bekasi",
    assignee: "Rizky",
    status: "ASSIGNED",
    estimatedLossPercent: 0.9,
    escalated: false,
    escalationReason: "Audit rutin",
    createdAt: isoOffset(0, -4),
    updatedAt: isoOffset(0, -2)
  },
  {
    id: "TCK-1008",
    title: "Maintenance ODP Area Antapani",
    description: "ODP perlu dibersihkan dan patch cord diganti.",
    areaId: "AR-BDG",
    ticketLatitude: -6.913221,
    ticketLongitude: 107.648312,
    validRadiusMeter: 150,
    problemType: "MAINTENANCE",
    priority: "HIGH",
    leaderId: "USR-LEADER-2",
    technicianId: "USR-TECH-2",
    createdBy: "USR-NOC-2",
    branch: "Bandung",
    assignee: "Dina",
    status: "IN_PROGRESS",
    estimatedLossPercent: 2.9,
    escalated: false,
    escalationReason: "Maintenance berkala",
    createdAt: isoOffset(-1, -10),
    updatedAt: isoOffset(0, -6)
  }
];

export const mockAttendanceHistory: AttendanceRecord[] = [
  {
    id: "ATD-1",
    userId: "USR-TECH-1",
    technicianName: "Andi",
    area: "Jakarta Selatan",
    leaderName: "Budi Santoso",
    date: dateOffset(0),
    checkInAt: "07:45",
    checkOutAt: "17:05",
    flagged: false
  },
  {
    id: "ATD-2",
    userId: "USR-TECH-2",
    technicianName: "Dina",
    area: "Bandung",
    leaderName: "Rina Putri",
    date: dateOffset(0),
    checkInAt: "08:20",
    checkOutAt: "17:15",
    flagged: true,
    flagType: "TERLAMBAT",
    reviewStatus: "BELUM_DITINJAU"
  },
  {
    id: "ATD-3",
    userId: "USR-TECH-3",
    technicianName: "Rizky",
    area: "Bekasi",
    leaderName: "Dewi Lestari",
    date: dateOffset(0),
    checkInAt: "07:58",
    flagged: false
  },
  {
    id: "ATD-4",
    userId: "USR-TECH-4",
    technicianName: "Bima",
    area: "Jakarta Selatan",
    leaderName: "Budi Santoso",
    date: dateOffset(0),
    checkInAt: "07:52",
    flagged: true,
    flagType: "TIDAK_CHECK_OUT",
    reviewStatus: "MENUNGGU_PENJELASAN"
  },
  {
    id: "ATD-5",
    userId: "USR-TECH-5",
    technicianName: "Nadia",
    area: "Bandung",
    leaderName: "Rina Putri",
    date: dateOffset(0),
    flagged: true,
    flagType: "TIDAK_HADIR",
    reviewStatus: "BELUM_DITINJAU"
  }
];

export const mockStock: StockItem[] = [
  { id: "MAT-1", sku: "DC-1C-001", name: "Dropcore 1C", unit: "meter", branch: "Jakarta Selatan", quantity: 3000, minimum: 800 },
  { id: "MAT-2", sku: "FCSC-APC-002", name: "Fast Connector SC/APC", unit: "unit", branch: "Bandung", quantity: 900, minimum: 300 },
  { id: "MAT-3", sku: "PCSC-APC-003", name: "Patchcord SC/APC", unit: "unit", branch: "Bekasi", quantity: 450, minimum: 120 },
  { id: "MAT-4", sku: "SPL-1-8-004", name: "Splitter 1:8", unit: "unit", branch: "Jakarta Selatan", quantity: 160, minimum: 50 },
  { id: "MAT-5", sku: "ONT-HG8245H-005", name: "ONT Huawei HG8245H", unit: "unit", branch: "Bandung", quantity: 110, minimum: 40 }
];

export const mockTransfers: TransferRequest[] = [
  {
    id: "TR-1",
    itemId: "MAT-2",
    fromBranch: "Jakarta Selatan",
    toBranch: "Bandung",
    quantity: 5,
    status: "PENDING",
    createdAt: isoOffset(0, -4)
  }
];

export const mockTicketMaterialRequests: TicketMaterialRequest[] = [
  { id: "TMR-1", ticketId: "TCK-1005", materialId: "MAT-1", qtyRequested: 200, createdAt: isoOffset(0, -3) },
  { id: "TMR-2", ticketId: "TCK-1003", materialId: "MAT-2", qtyRequested: 12, createdAt: isoOffset(0, -1) },
  { id: "TMR-3", ticketId: "TCK-1007", materialId: "MAT-4", qtyRequested: 6, createdAt: isoOffset(0, -2) },
  { id: "TMR-4", ticketId: "TCK-1008", materialId: "MAT-2", qtyRequested: 40, createdAt: isoOffset(-1, -8) }
];

export const mockTicketMaterialReports: TicketMaterialReport[] = [
  {
    id: "TMR-RPT-1",
    ticketId: "TCK-1005",
    technicianId: "USR-TECH-1",
    materialId: "MAT-2",
    materialName: "Dropcore",
    used: 188,
    remaining: 12,
    photoPath: "/mock/material-remaining-dropcore.webp",
    latitude: -6.261018,
    longitude: 106.813901,
    accuracy: 16,
    capturedAtServer: isoOffset(0, -1),
    createdAt: isoOffset(0, -1)
  }
];

export const mockLossReports: LossReport[] = [
  {
    id: "LOSS-1001",
    ticketId: "TCK-1005",
    technicianId: "USR-TECH-1",
    technicianName: "Andi",
    itemId: "MAT-1",
    area: "Jakarta Selatan",
    quantityLost: 25,
    lossPercent: 12.5,
    note: "Dropcore rusak saat penarikan di jalur existing.",
    photoUrl: "/mock/loss-dropcore.jpg",
    status: "MENUNGGU",
    createdAt: isoOffset(0, -2)
  },
  {
    id: "LOSS-1002",
    ticketId: "TCK-1003",
    technicianId: "USR-TECH-2",
    technicianName: "Dina",
    itemId: "MAT-2",
    area: "Bandung",
    quantityLost: 4,
    lossPercent: 8.1,
    note: "Fast connector patah saat penanganan darurat.",
    status: "DALAM_INVESTIGASI",
    investigationStatus: "Menunggu validasi leader",
    createdAt: isoOffset(0, -1)
  },
  {
    id: "LOSS-1003",
    ticketId: "TCK-1004",
    technicianId: "USR-TECH-3",
    technicianName: "Rizky",
    itemId: "MAT-3",
    area: "Bekasi",
    quantityLost: 2,
    lossPercent: 2.2,
    note: "Patchcord tidak terbukti hilang setelah audit.",
    status: "DITOLAK",
    rejectedReason: "Tidak ada bukti kehilangan material.",
    reviewedAt: isoOffset(0, -3),
    createdAt: isoOffset(-1, -3)
  }
];

export const mockAreaBaselines: AreaBaseline[] = [
  { areaId: "AR-JKS", areaName: "Jakarta Selatan", averageRepairHours: 2.8, repeatFaults: 3, slaCompliance: 94 },
  { areaId: "AR-BDG", areaName: "Bandung", averageRepairHours: 4.3, repeatFaults: 6, slaCompliance: 82 },
  { areaId: "AR-BKS", areaName: "Bekasi", averageRepairHours: 3.6, repeatFaults: 4, slaCompliance: 88 }
];

export const mockAuditLogs: AuditLogItem[] = [
  {
    id: "LOG-1001",
    createdAt: isoOffset(0, -5),
    user: "manager@isp.local",
    actionType: "ASSIGN_TICKET",
    entityType: "Ticket",
    entityId: "TCK-1007",
    before: "Belum ada teknisi",
    after: "Rizky ditugaskan",
    source: "Web Dashboard",
    reviewStatus: "BARU"
  },
  {
    id: "LOG-1002",
    createdAt: isoOffset(0, -4),
    user: "leader@isp.local",
    actionType: "STATUS_CHANGED",
    entityType: "Ticket",
    entityId: "TCK-1005",
    before: "ASSIGNED",
    after: "IN_PROGRESS",
    source: "Mobile Ops",
    reviewStatus: "DITANDAI"
  },
  {
    id: "LOG-1003",
    createdAt: isoOffset(0, -2),
    user: "manager@isp.local",
    actionType: "LOSS_REJECTED",
    entityType: "Loss",
    entityId: "LOSS-1003",
    before: "MENUNGGU",
    after: "DITOLAK",
    source: "Web Dashboard",
    reviewStatus: "SELESAI"
  }
];

export const mockIncidents: IncidentAlert[] = [
  {
    id: "INC-1001",
    areaId: "AR-BDG",
    areaName: "Bandung",
    severity: "KRITIS",
    ticketCount: 3,
    escalationCount: 1,
    detectedAt: isoOffset(0, -1),
    responseStatus: "TERDETEKSI"
  }
];

export const mockAreaActions: AreaActionRecord[] = [
  {
    id: "AREA-ACT-1",
    areaName: "Bandung",
    action: "Investigasi infrastruktur dibuka",
    createdAt: isoOffset(0, -1)
  }
];

export const mockTechnicianLocationLogs: TechnicianLocationLog[] = [
  {
    id: "LOC-1001",
    userId: "USR-TECH-1",
    technicianName: "Andi",
    ticketId: "TCK-1005",
    branch: "Jakarta Selatan",
    area: "Jakarta Selatan",
    latitude: -6.260982,
    longitude: 106.813922,
    accuracy: 18,
    calculatedDistanceMeter: 45,
    locationStatus: "valid",
    needsReview: false,
    riskScore: 0,
    riskReasons: [],
    sourceType: "heartbeat",
    createdAt: isoOffset(0, -1)
  },
  {
    id: "LOC-1002",
    userId: "USR-TECH-2",
    technicianName: "Dina",
    ticketId: "TCK-1008",
    branch: "Bandung",
    area: "Bandung",
    latitude: -6.912812,
    longitude: 107.648901,
    accuracy: 32,
    calculatedDistanceMeter: 88,
    locationStatus: "warning",
    needsReview: false,
    riskScore: 28,
    riskReasons: ["Jarak melebihi radius 150 meter"],
    sourceType: "progress",
    createdAt: isoOffset(0, -1)
  },
  {
    id: "LOC-1003",
    userId: "USR-TECH-3",
    technicianName: "Rizky",
    ticketId: "TCK-1007",
    branch: "Bekasi",
    area: "Bekasi",
    latitude: -6.225712,
    longitude: 107.018012,
    accuracy: 21,
    calculatedDistanceMeter: 52,
    locationStatus: "valid",
    needsReview: false,
    riskScore: 0,
    riskReasons: [],
    sourceType: "assignment",
    createdAt: isoOffset(0, -2)
  }
];

export const mockTicketProgressPhotos: TicketProgressPhotoRecord[] = [
  {
    id: "TPP-1001",
    ticketId: "TCK-1005",
    userId: "USR-TECH-1",
    progressType: "MULAI_PEKERJAAN",
    imagePath: "/mock/progress-start.webp",
    imageSizeKb: 58.4,
    latitude: -6.261101,
    longitude: 106.813742,
    accuracy: 18,
    calculatedDistanceMeter: 37,
    locationStatus: "valid",
    needsReview: false,
    riskScore: 0,
    riskReasons: [],
    capturedAtServer: isoOffset(0, -2),
    uploadedAtServer: isoOffset(0, -2)
  }
];
