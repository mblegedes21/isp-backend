import { TICKET_STATUS } from "@/types/ticket";

export const cabangList = [
  "Jakarta Selatan",
  "Bandung",
  "Bekasi",
  "Depok",
  "Bogor"
];

export const prioritasList = ["Rendah", "Sedang", "Tinggi", "Kritis"];

export const jenisGangguanList = [
  "Fiber Putus",
  "ONU Tidak Stabil",
  "Gangguan Backbone",
  "Instalasi Pelanggan",
  "Perangkat Rusak"
];

export const jenisPekerjaanTeknisi = [
  "Perbaikan Fiber",
  "Migrasi Perangkat",
  "Maintenance ODP",
  "Instalasi Baru"
];

export const statusTiketLabel: Record<string, string> = {
  [TICKET_STATUS.CREATED]: "Dibuat",
  [TICKET_STATUS.ASSIGNED]: "Ditugaskan",
  [TICKET_STATUS.MATERIAL_PREPARED]: "Material Disiapkan",
  [TICKET_STATUS.IN_PROGRESS]: "Sedang Dikerjakan",
  [TICKET_STATUS.ESCALATED]: "Eskalasi",
  [TICKET_STATUS.COMPLETED]: "Selesai",
  [TICKET_STATUS.PENDING_MANAGER_REVIEW]: "Menunggu Review Manager",
  [TICKET_STATUS.CLOSED]: "Ditutup",
  [TICKET_STATUS.CLOSED_WITH_LOSS]: "Ditutup dengan Loss"
};

export const formatTanggal = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
