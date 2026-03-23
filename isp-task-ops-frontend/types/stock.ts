export interface StockItem {
  id: string;
  sku: string;
  name: string;
  materialName?: string;
  categoryId?: string | null;
  category?: string;
  brandId?: string | null;
  brand?: string;
  model?: string;
  unit: string;
  branchId?: string | null;
  branch: string;
  quantity: number;
  minimum: number;
  purchasePrice?: number;
  description?: string | null;
  isActive?: boolean;
  status?: "LOW_STOCK" | "NORMAL";
}

export interface PurchaseRequest {
  id: string;
  materialId: string;
  materialName: string;
  branchId: string;
  branchName: string;
  requestedBy: string;
  requestedByName: string;
  quantity: number;
  estimatedPrice: number;
  supplier?: string | null;
  notes?: string | null;
  status: "pending" | "approved" | "ordered" | "received" | "rejected";
  createdAt: string;
}

export interface StockAudit {
  id: string;
  materialId: string;
  materialName: string;
  branchId: string;
  branchName: string;
  systemStock: number;
  physicalStock: number;
  difference: number;
  unitPrice: number;
  totalDifferenceValue: number;
  notes?: string | null;
  createdBy: string;
  createdByName: string;
  status: "pending" | "approved" | "rejected";
  canCreateLoss: boolean;
  createdAt: string;
}

export interface MaterialCategoryOption {
  id: string;
  name: string;
  description?: string | null;
}

export interface MaterialBrandOption {
  id: string;
  categoryId: string;
  name: string;
}

export interface TransferRequest {
  id: string;
  itemId: string;
  fromBranch: string;
  toBranch: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface LossReport {
  id: string;
  ticketId: string;
  technicianId: string;
  technicianName: string;
  itemId: string;
  materialName?: string;
  area: string;
  quantityLost: number;
  unitPrice?: number;
  totalPrice?: number;
  lossPercent: number;
  note: string;
  photoUrl?: string;
  status: "MENUNGGU" | "DISETUJUI" | "DITOLAK" | "DALAM_INVESTIGASI";
  rejectedReason?: string;
  investigationStatus?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface StockTransaction {
  id: string;
  materialId: string;
  materialName?: string;
  category?: string;
  brand?: string;
  unit?: string;
  branch?: string;
  transactionType: "OUT" | "IN" | "TRANSFER" | "RETURN" | "LOSS" | "AUDIT_ADJUSTMENT";
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  createdAt: string;
}

export type WarehouseTransactionType =
  | "antar_gudang_in"
  | "pengembalian_teknisi"
  | "pembelian_material"
  | "antar_gudang_out"
  | "pengeluaran_teknisi"
  | "penjualan_material"
  | "technician_out"
  | "technician_return";

export interface WarehouseTransaction {
  id: string;
  materialId: string;
  materialName: string;
  unit?: string | null;
  transactionType: WarehouseTransactionType;
  historyType?: WarehouseTransactionType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  totalValue?: number;
  sourceBranch?: string | null;
  destinationBranch?: string | null;
  technicianId?: string | null;
  technicianName?: string | null;
  supplier?: string | null;
  customer?: string | null;
  ticketId?: string | null;
  ticketNumber?: string | null;
  purchaseRequestId?: string | null;
  condition?: string | null;
  status: string;
  notes?: string | null;
  createdBy?: string | null;
  createdByName?: string | null;
  createdAt: string;
}

export interface WarehouseTransactionTotals {
  quantity: number;
  value: number;
}

export interface WarehouseTransactionHistory {
  rows: WarehouseTransaction[];
  totals: WarehouseTransactionTotals;
}

export interface TicketMaterialRequest {
  id: string;
  ticketId: string;
  technicianId?: string | null;
  technicianName?: string | null;
  materialId: string;
  materialName?: string;
  unit?: string | null;
  qtyRequested: number;
  requestedBy?: string;
  requestedByName?: string;
  requestedRole?: "LEADER" | "TEKNISI" | "MANAGER";
  status?: string;
  releasedQuantity?: number;
  returnedQuantity?: number;
  createdAt: string;
}

export interface TicketMaterialRequestGroup {
  ticketId: string;
  ticketDbId: string;
  leaderName: string;
  technicianId?: string | null;
  technicianIds?: string[];
  technicianOptions?: Array<{ id: string; name: string }>;
  technicians: string[];
  requestedMaterials: Array<{
    id: string;
    technicianId?: string | null;
    technicianName?: string | null;
    materialId: string;
    materialName: string;
    unit?: string | null;
    quantity: number;
    requestedByName: string;
    requestedRole: string;
    status: string;
    releasedQuantity: number;
    returnedQuantity: number;
  }>;
}

export interface MaterialReleaseReport {
  ticketId: string;
  leaderName: string;
  technicians: string[];
  materials: Array<{
    materialName: string;
    unit?: string | null;
    quantity: number;
  }>;
}

export interface ReleaseTicketMaterialPayload {
  ticketId: number;
  technicianId?: number;
  materials: Array<{
    materialId: number;
    quantity: number;
    requestId?: number;
  }>;
}

export interface MaterialReturnChecklistRow {
  requestId: string;
  materialId: string;
  materialName: string;
  unit?: string | null;
  quantityReleased: number;
  quantityReturned: number;
  remainingQuantity: number;
  status: "Returned" | "Used";
}

export interface AssignedTechnicianMaterial {
  ticketId: string;
  ticketNumber: string;
  technicianId: string;
  materialId: string;
  materialName: string;
  unit?: string | null;
  quantityAssigned: number;
  currentStock: number;
  reportedUsed: number;
  reportedRemaining: number;
  photoPath?: string | null;
}

export interface TicketMaterialReport {
  id: string;
  ticketId: string;
  technicianId: string;
  materialId: string;
  materialName?: string;
  unit?: string | null;
  used: number;
  remaining: number;
  photoPath: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  capturedAtServer: string;
  createdAt: string;
}
