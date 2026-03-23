export const ROLES = ["NOC", "LEADER", "ADMIN_GUDANG", "TEKNISI", "MANAGER", "MITRA"] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  NOC: "NOC",
  LEADER: "Leader",
  ADMIN_GUDANG: "Admin Gudang",
  TEKNISI: "Teknisi",
  MANAGER: "Manager",
  MITRA: "Mitra",
};
