"use client";

import { create } from "zustand";
import { apiClient, buildActorHeaders, extractApiErrors, extractApiMessage, unwrapApiData } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import type { AssignedTechnicianMaterial, LossReport, MaterialBrandOption, MaterialCategoryOption, MaterialReleaseReport, MaterialReturnChecklistRow, PurchaseRequest, ReleaseTicketMaterialPayload, StockAudit, StockItem, StockTransaction, TicketMaterialReport, TicketMaterialRequest, TicketMaterialRequestGroup, TransferRequest, WarehouseTransaction, WarehouseTransactionHistory, WarehouseTransactionType } from "@/types/stock";

interface StockState {
  items: StockItem[];
  categories: MaterialCategoryOption[];
  brands: MaterialBrandOption[];
  transactions: StockTransaction[];
  transfers: TransferRequest[];
  losses: LossReport[];
  purchaseRequests: PurchaseRequest[];
  stockAudits: StockAudit[];
  ticketMaterialRequests: TicketMaterialRequest[];
  materialReports: TicketMaterialReport[];
  assignedTechnicianMaterials: AssignedTechnicianMaterial[];
  fetchMaterialCategories: () => Promise<MaterialCategoryOption[]>;
  createMaterial: (payload: {
    branchId: string;
    categoryId: string;
    brand: string;
    name: string;
    sku: string;
    unit: string;
    stock: number;
    minimumStock: number;
    purchasePrice: number;
    description?: string;
  }) => Promise<StockItem>;
  deleteMaterial: (id: string) => Promise<void>;
  updateMaterial: (id: string, payload: Partial<{
    branchId: string;
    categoryId: string;
    brand?: string | null;
    name: string;
    sku: string;
    unit: string;
    stock: number;
    minimumStock: number;
    purchasePrice: number;
    description: string;
    isActive: boolean;
  }>) => Promise<StockItem>;
  deactivateMaterial: (id: string) => Promise<StockItem>;
  receiveStock: (payload: { materialId: string; branchId: string; quantity: number; unitPrice: number; source?: string; notes?: string }) => Promise<void>;
  issueStock: (payload: { materialId: string; branchId: string; quantity: number; unitPrice: number; ticketId?: string; notes?: string; issuedTo?: string; transactionType?: "OUT" | "RETURN" }) => Promise<void>;
  requestTransfer: (payload: Omit<TransferRequest, "id" | "status" | "createdAt">) => Promise<void>;
  approveTransfer: (id: string) => Promise<void>;
  createPurchaseRequest: (payload: { materialId: string; branchId: string; quantity: number; estimatedPrice: number; supplier?: string; notes?: string }) => Promise<void>;
  approvePurchaseRequest: (id: string) => Promise<void>;
  rejectPurchaseRequest: (id: string, reason: string) => Promise<void>;
  resendPurchaseRequest: (id: string) => Promise<void>;
  fetchWarehouseTransactions: (type: WarehouseTransactionType) => Promise<WarehouseTransaction[]>;
  fetchWarehouseHistory: (type?: WarehouseTransactionType) => Promise<WarehouseTransactionHistory>;
  createWarehouseTransaction: (payload: {
    materialId: string;
    transactionType: WarehouseTransactionType;
    quantity: number;
    unitPrice?: number;
    sourceBranch?: string;
    destinationBranch?: string;
    technicianId?: string;
    technicianName?: string;
    supplier?: string;
    customer?: string;
    ticketId?: string;
    purchaseRequestId?: string;
    condition?: string;
    status?: string;
    notes?: string;
  }) => Promise<WarehouseTransaction>;
  performStockAudit: (payload: { materialId: string; branchId: string; physicalStock: number; unitPrice: number; notes?: string }) => Promise<void>;
  approveStockAudit: (id: string) => Promise<void>;
  rejectStockAudit: (id: string, reason: string) => Promise<void>;
  createLossFromAudit: (id: string) => Promise<void>;
  submitLossReport: (payload: Omit<LossReport, "id" | "status" | "createdAt" | "reviewedAt">) => Promise<void>;
  requestTicketMaterials: (ticketId: string, materials: Array<{ materialId: string; quantity: number; technicianId: string }>) => Promise<TicketMaterialRequest[]>;
  fetchTicketMaterials: (ticketId: string) => Promise<TicketMaterialRequest[]>;
  fetchTicketMaterialRequests: (filters?: { ticketId?: string; status?: string }) => Promise<TicketMaterialRequestGroup[]>;
  processMaterialRequest: (id: string) => Promise<TicketMaterialRequest>;
  fetchAssignedTechnicianMaterials: (ticketId?: string) => Promise<AssignedTechnicianMaterial[]>;
  releaseTicketMaterials: (payload: ReleaseTicketMaterialPayload) => Promise<MaterialReleaseReport>;
  fetchMaterialReleaseReport: (ticketDbId: string) => Promise<MaterialReleaseReport>;
  fetchMaterialReturnChecklist: (ticketDbId: string) => Promise<{ ticketId: string; rows: MaterialReturnChecklistRow[] }>;
  processMaterialReturns: (ticketDbId: string, returns: Array<{ requestId: string; quantityReturned: number }>) => Promise<{ ticketId: string; rows: MaterialReturnChecklistRow[] }>;
  submitMaterialReport: (payload: {
    ticketId: string;
    technicianId: string;
    materials: Array<{
      materialId: string;
      used: number;
      remaining: number;
      photo?: File | Blob | null;
      existingPhotoPath?: string | null;
    }>;
    latitude: number;
    longitude: number;
    accuracy: number;
    deviceTimestamp?: string;
  }) => Promise<TicketMaterialReport[]>;
  getLowStockCount: () => number;
  getMaterialUsageToday: () => Array<{ materialId: string; totalQuantity: number }>;
  getMaterialUsageWeek: () => Array<{ materialId: string; totalQuantity: number }>;
  approveLoss: (id: string) => Promise<void>;
  rejectLoss: (id: string, reason: string) => Promise<void>;
  startLossInvestigation: (id: string) => Promise<void>;
}

type FieldError = Error & { fieldErrors?: Record<string, string[]> };

const today = () => new Date().toISOString().slice(0, 10);

const mapPurchaseRequest = (data: Record<string, unknown>, fallback?: Partial<PurchaseRequest>): PurchaseRequest => ({
  id: String(data.id ?? fallback?.id ?? ""),
  materialId: String(data.material_id ?? fallback?.materialId ?? ""),
  materialName: String(data.material_name ?? fallback?.materialName ?? "-"),
  branchId: String(data.branch_id ?? fallback?.branchId ?? ""),
  branchName: String(data.branch_name ?? fallback?.branchName ?? "-"),
  requestedBy: String(data.requested_by ?? fallback?.requestedBy ?? ""),
  requestedByName: String(data.requested_by_name ?? fallback?.requestedByName ?? "-"),
  quantity: Number(data.quantity ?? fallback?.quantity ?? 0),
  estimatedPrice: Number(data.estimated_price ?? fallback?.estimatedPrice ?? 0),
  supplier: (data.supplier as string | null | undefined) ?? fallback?.supplier ?? null,
  notes: (data.notes as string | null | undefined) ?? fallback?.notes ?? null,
  status: String(data.status ?? fallback?.status ?? "pending") as PurchaseRequest["status"],
  createdAt: String(data.created_at ?? fallback?.createdAt ?? new Date().toISOString())
});

const mapWarehouseTransaction = (data: Record<string, unknown>): WarehouseTransaction => ({
  id: String(data.id ?? ""),
  materialId: String(data.material_id ?? ""),
  materialName: String(data.material_name ?? "-"),
  unit: (data.unit as string | null | undefined) ?? null,
  transactionType: String(data.transaction_type ?? "") as WarehouseTransactionType,
  historyType: String(data.history_type ?? data.transaction_type ?? "") as WarehouseTransactionType,
  quantity: Number(data.quantity ?? 0),
  unitPrice: Number(data.unit_price ?? 0),
  totalPrice: Number(data.total_price ?? 0),
  totalValue: Number(data.total_value ?? data.total_price ?? 0),
  sourceBranch: (data.source_branch as string | null | undefined) ?? null,
  destinationBranch: (data.destination_branch as string | null | undefined) ?? null,
  technicianId: data.technician_id ? String(data.technician_id) : null,
  technicianName: (data.technician_name as string | null | undefined) ?? null,
  supplier: (data.supplier as string | null | undefined) ?? null,
  customer: (data.customer as string | null | undefined) ?? null,
  ticketId: data.ticket_id ? String(data.ticket_id) : null,
  ticketNumber: (data.ticket_number as string | null | undefined) ?? null,
  purchaseRequestId: data.purchase_request_id ? String(data.purchase_request_id) : null,
  condition: (data.condition as string | null | undefined) ?? null,
  status: String(data.status ?? "COMPLETED"),
  notes: (data.notes as string | null | undefined) ?? null,
  createdBy: data.created_by ? String(data.created_by) : null,
  createdByName: (data.created_by_name as string | null | undefined) ?? null,
  createdAt: String(data.created_at ?? new Date().toISOString()),
});

const mapTicketMaterialRequest = (data: Record<string, unknown>): TicketMaterialRequest => ({
  id: String(data.id ?? ""),
  ticketId: String(data.ticket_id ?? ""),
  technicianId: data.teknisi_id ? String(data.teknisi_id) : data.technician_id ? String(data.technician_id) : null,
  technicianName: (data.technician_name as string | null | undefined) ?? null,
  materialId: String(data.material_id ?? ""),
  materialName: (data.material_name as string | undefined) ?? undefined,
  unit: (data.unit as string | null | undefined) ?? null,
  qtyRequested: Number(data.quantity ?? data.qty_requested ?? 0),
  requestedBy: data.requested_by ? String(data.requested_by) : undefined,
  requestedByName: (data.requested_by_name as string | undefined) ?? undefined,
  requestedRole: (data.requested_role as TicketMaterialRequest["requestedRole"]) ?? undefined,
  status: (data.status as string | undefined) ?? undefined,
  releasedQuantity: Number(data.released_quantity ?? 0),
  returnedQuantity: Number(data.returned_quantity ?? 0),
  createdAt: String(data.created_at ?? new Date().toISOString()),
});

const mapTicketMaterialRequestGroup = (data: Record<string, unknown>): TicketMaterialRequestGroup => ({
  ticketId: String(data.ticket_id ?? ""),
  ticketDbId: String(data.ticket_db_id ?? ""),
  leaderName: String(data.leader_name ?? "-"),
  technicianId: data.teknisi_id ? String(data.teknisi_id) : data.technician_id ? String(data.technician_id) : null,
  technicianIds: Array.isArray(data.teknisi_ids)
    ? data.teknisi_ids.map((item) => String(item))
    : Array.isArray(data.technician_ids) ? data.technician_ids.map((item) => String(item)) : [],
  technicianOptions: Array.isArray(data.teknisi_options)
    ? data.teknisi_options.map((item) => {
        const row = item as Record<string, unknown>;
        return {
          id: String(row.id ?? ""),
          name: String(row.name ?? "-"),
        };
      })
    : Array.isArray(data.technician_options)
    ? data.technician_options.map((item) => {
        const row = item as Record<string, unknown>;
        return {
          id: String(row.id ?? ""),
          name: String(row.name ?? "-"),
        };
      })
    : [],
  technicians: Array.isArray(data.technicians) ? data.technicians.map((item) => String(item)) : [],
  requestedMaterials: Array.isArray(data.requested_materials)
    ? data.requested_materials.map((item) => {
        const row = item as Record<string, unknown>;
        return {
          id: String(row.id ?? ""),
          technicianId: row.teknisi_id ? String(row.teknisi_id) : row.technician_id ? String(row.technician_id) : null,
          technicianName: (row.technician_name as string | null | undefined) ?? null,
          materialId: String(row.material_id ?? ""),
          materialName: String(row.material_name ?? "-"),
          unit: (row.unit as string | null | undefined) ?? null,
          quantity: Number(row.quantity ?? 0),
          requestedByName: String(row.requested_by_name ?? "-"),
          requestedRole: String(row.requested_role ?? "-"),
          status: String(row.status ?? "PENDING"),
          releasedQuantity: Number(row.released_quantity ?? 0),
          returnedQuantity: Number(row.returned_quantity ?? 0),
        };
      })
    : [],
});

const mapMaterialReleaseReport = (data: Record<string, unknown>): MaterialReleaseReport => ({
  ticketId: String(data.ticket_id ?? ""),
  leaderName: String(data.leader_name ?? "-"),
  technicians: Array.isArray(data.technicians) ? data.technicians.map((item) => String(item)) : [],
  materials: Array.isArray(data.materials)
    ? data.materials.map((item) => {
        const row = item as Record<string, unknown>;
        return {
          materialName: String(row.material_name ?? "-"),
          unit: (row.unit as string | null | undefined) ?? null,
          quantity: Number(row.quantity ?? 0),
        };
      })
    : [],
});

const mapReturnChecklist = (data: Record<string, unknown>) => ({
  ticketId: String(data.ticket_id ?? ""),
  rows: Array.isArray(data.rows)
    ? data.rows.map((item) => {
        const row = item as Record<string, unknown>;
        return {
          requestId: String(row.request_id ?? ""),
          materialId: String(row.material_id ?? ""),
          materialName: String(row.material_name ?? "-"),
          unit: (row.unit as string | null | undefined) ?? null,
          quantityReleased: Number(row.quantity_released ?? 0),
          quantityReturned: Number(row.quantity_returned ?? 0),
          remainingQuantity: Number(row.remaining_quantity ?? 0),
          status: String(row.status ?? "Used") as MaterialReturnChecklistRow["status"],
        };
      })
    : [],
});

const mapAssignedTechnicianMaterial = (data: Record<string, unknown>): AssignedTechnicianMaterial => ({
  ticketId: String(data.ticket_id ?? ""),
  ticketNumber: String(data.ticket_number ?? data.ticket_id ?? ""),
  technicianId: String(data.teknisi_id ?? data.technician_id ?? ""),
  materialId: String(data.material_id ?? ""),
  materialName: String(data.material_name ?? "-"),
  unit: (data.unit as string | null | undefined) ?? null,
  quantityAssigned: Number(data.quantity_assigned ?? 0),
  currentStock: Number(data.current_stock ?? 0),
  reportedUsed: Number(data.reported_used ?? 0),
  reportedRemaining: Number(data.reported_remaining ?? 0),
  photoPath: (data.photo_path as string | null | undefined) ?? null,
});

const mapTicketMaterialReport = (data: Record<string, unknown>): TicketMaterialReport => ({
  id: String(data.id ?? ""),
  ticketId: String(data.ticket_id ?? data.ticketId ?? ""),
  technicianId: String(data.technician_id ?? data.technicianId ?? ""),
  materialId: String(data.material_id ?? data.materialId ?? ""),
  materialName: (data.material_name as string | undefined) ?? undefined,
  unit: (data.unit as string | null | undefined) ?? null,
  used: Number(data.used ?? 0),
  remaining: Number(data.remaining ?? 0),
  photoPath: String(data.photo_path ?? data.photoPath ?? ""),
  latitude: data.latitude !== undefined && data.latitude !== null ? Number(data.latitude) : null,
  longitude: data.longitude !== undefined && data.longitude !== null ? Number(data.longitude) : null,
  accuracy: data.accuracy !== undefined && data.accuracy !== null ? Number(data.accuracy) : null,
  capturedAtServer: String(data.captured_at_server ?? data.capturedAtServer ?? new Date().toISOString()),
  createdAt: String(data.created_at ?? data.createdAt ?? new Date().toISOString()),
});

export const useStockStore = create<StockState>((set, get) => ({
  items: [],
  categories: [],
  brands: [],
  transactions: [],
  transfers: [],
  losses: [],
  purchaseRequests: [],
  stockAudits: [],
  ticketMaterialRequests: [],
  materialReports: [],
  assignedTechnicianMaterials: [],
  fetchMaterialCategories: async () => {
    const actor = useAuthStore.getState().user;
    const { data } = await apiClient.get("/material-categories", {
      headers: buildActorHeaders(actor),
    });

    const categories = Array.isArray(data?.data)
      ? data.data.map((item: { id?: string | number; name?: string; description?: string | null }) => ({
          id: String(item.id ?? ""),
          name: String(item.name ?? ""),
          description: item.description ?? null,
        }))
      : [];

    set({ categories });

    return categories;
  },
  createMaterial: async (payload) => {
    const actor = useAuthStore.getState().user;
    try {
      const { data } = await apiClient.post(
        "/materials",
          {
            branch_id: payload.branchId,
            category_id: Number(payload.categoryId),
            brand: payload.brand,
            name: payload.name,
            sku: payload.sku,
            unit: payload.unit,
            current_stock: Number(payload.stock),
            minimum_stock: Number(payload.minimumStock),
            purchase_price: Number(payload.purchasePrice),
            description: payload.description
        },
        { headers: buildActorHeaders(actor) }
      );

      const row = unwrapApiData<Record<string, unknown>>(data);
      const created: StockItem = {
        id: String(row.id ?? ""),
        sku: String(row.sku ?? ""),
        name: String(row.name ?? ""),
        materialName: row.material_name as string | undefined,
        categoryId: row.category_id ? String(row.category_id) : null,
        category: row.category as string | undefined,
        brandId: row.brand_id ? String(row.brand_id) : null,
        brand: row.brand_name as string | undefined,
        model: row.model as string | undefined,
        unit: String(row.unit ?? ""),
        branchId: row.branch_id ? String(row.branch_id) : null,
        branch: (row.branch_name as string | undefined) ?? "-",
        quantity: Number(row.stock ?? 0),
        minimum: Number(row.minimum_stock ?? 0),
        purchasePrice: Number(row.purchase_price ?? 0),
        description: (row.description as string | null | undefined) ?? null,
        isActive: Boolean(row.is_active),
        status: (row.inventory_status as "LOW_STOCK" | "NORMAL" | undefined) ?? (Number(row.stock ?? 0) <= Number(row.minimum_stock ?? 0) ? "LOW_STOCK" : "NORMAL")
      };

      set({ items: [created, ...get().items] });
      return created;
    } catch (error) {
      const wrapped = new Error(extractApiMessage(error, "Gagal menambah material.")) as FieldError;
      wrapped.fieldErrors = extractApiErrors(error);
      throw wrapped;
    }
  },
  deleteMaterial: async (id) => {
    const actor = useAuthStore.getState().user;
    try {
      await apiClient.delete(`/materials/${id}`, { headers: buildActorHeaders(actor) });
      set({ items: get().items.filter((item) => item.id !== id) });
    } catch (error) {
      throw new Error(extractApiMessage(error, "Gagal menghapus material."));
    }
  },
  updateMaterial: async (id, payload) => {
    const actor = useAuthStore.getState().user;
    try {
      const { data } = await apiClient.put(
        `/materials/${id}`,
        {
          branch_id: payload.branchId,
          category_id: payload.categoryId ? Number(payload.categoryId) : undefined,
          brand: payload.brand,
          name: payload.name,
          sku: payload.sku,
          unit: payload.unit,
          current_stock: payload.stock !== undefined ? Number(payload.stock) : undefined,
          minimum_stock: payload.minimumStock !== undefined ? Number(payload.minimumStock) : undefined,
          purchase_price: payload.purchasePrice !== undefined ? Number(payload.purchasePrice) : undefined,
          description: payload.description,
          is_active: payload.isActive
        },
        { headers: buildActorHeaders(actor) }
      );

      const updated: StockItem = {
        id: String(data.data.id),
        sku: data.data.sku,
        name: data.data.name,
        materialName: data.data.material_name,
        categoryId: data.data.category_id ? String(data.data.category_id) : null,
        category: data.data.category,
        brandId: data.data.brand_id ? String(data.data.brand_id) : null,
        brand: data.data.brand_name,
        model: data.data.model,
        unit: data.data.unit,
        branchId: data.data.branch_id ? String(data.data.branch_id) : null,
        branch: data.data.branch_name ?? "-",
        quantity: data.data.stock,
        minimum: data.data.minimum_stock,
        purchasePrice: Number(data.data.purchase_price ?? 0),
        description: data.data.description,
        isActive: data.data.is_active,
        status: data.data.inventory_status ?? (data.data.stock <= data.data.minimum_stock ? "LOW_STOCK" : "NORMAL")
      };

      set({
        items: get().items.map((item) => (item.id === id ? updated : item))
      });

      return updated;
    } catch (error) {
      const wrapped = new Error(extractApiMessage(error, "Gagal mengubah material.")) as FieldError;
      wrapped.fieldErrors = extractApiErrors(error);
      throw wrapped;
    }
  },
  deactivateMaterial: async (id) => {
    return get().updateMaterial(id, { isActive: false });
  },
  receiveStock: async (payload) => {
    const actor = useAuthStore.getState().user;
    const currentItem = get().items.find((item) => item.id === payload.materialId);
    try {
      const { data } = await apiClient.post(
        "/stock-receipts",
        {
          material_id: payload.materialId,
          branch_id: payload.branchId,
          quantity: payload.quantity,
          unit_price: payload.unitPrice,
          source: payload.source,
          notes: payload.notes
        },
        { headers: buildActorHeaders(actor) }
      );

      set({
        items: get().items.map((item) =>
          item.id === payload.materialId
            ? {
                ...item,
                branchId: payload.branchId,
                quantity: item.quantity + payload.quantity,
                status: item.quantity + payload.quantity <= item.minimum ? "LOW_STOCK" : "NORMAL"
              }
            : item
        ),
        transactions: [
          {
            id: String(data.data?.transaction?.id ?? `TX-${Date.now()}`),
            materialId: payload.materialId,
            materialName: currentItem?.materialName ?? currentItem?.name,
            category: currentItem?.category,
            brand: currentItem?.brand,
            unit: currentItem?.unit,
            branch: get().items.find((item) => item.id === payload.materialId)?.branch ?? actor?.branchName ?? "-",
            transactionType: "IN",
            quantity: payload.quantity,
            unitPrice: payload.unitPrice,
            totalPrice: payload.quantity * payload.unitPrice,
            createdAt: new Date().toISOString(),
            notes: payload.notes
          },
          ...get().transactions
        ]
      });
    } catch (error) {
      throw new Error(extractApiMessage(error, "Gagal mencatat penerimaan barang."));
    }
  },
  issueStock: async (payload) => {
    const actor = useAuthStore.getState().user;
    const currentItem = get().items.find((item) => item.id === payload.materialId);
    try {
      const { data } = await apiClient.post(
        "/stock-issues",
        {
          material_id: payload.materialId,
          branch_id: payload.branchId,
          ticket_id: payload.ticketId,
          issued_to: payload.issuedTo,
          quantity: payload.quantity,
          unit_price: payload.unitPrice,
          transaction_type: payload.transactionType ?? "OUT",
          notes: payload.notes
        },
        { headers: buildActorHeaders(actor) }
      );

      set({
        items: get().items.map((item) =>
          item.id === payload.materialId
            ? {
                ...item,
                quantity: Math.max(0, item.quantity - payload.quantity),
                status: item.quantity - payload.quantity <= item.minimum ? "LOW_STOCK" : "NORMAL"
              }
            : item
        ),
        transactions: [
          {
            id: String(data.data?.transaction?.id ?? `TX-${Date.now()}`),
            materialId: payload.materialId,
            materialName: currentItem?.materialName ?? currentItem?.name,
            category: currentItem?.category,
            brand: currentItem?.brand,
            unit: currentItem?.unit,
            branch: currentItem?.branch ?? actor?.branchName ?? "-",
            transactionType: payload.transactionType ?? "OUT",
            quantity: payload.quantity,
            unitPrice: payload.unitPrice,
            totalPrice: payload.quantity * payload.unitPrice,
            createdAt: new Date().toISOString(),
            notes: payload.notes
          },
          ...get().transactions
        ]
      });
    } catch (error) {
      throw new Error(extractApiMessage(error, "Gagal mencatat pengeluaran barang."));
    }
  },
  requestTransfer: async (payload) => {
    const actor = useAuthStore.getState().user;
    const currentItem = get().items.find((item) => item.id === payload.itemId);
    try {
      const { data } = await apiClient.post(
        "/stock-transfers",
        {
          item_id: payload.itemId,
          from_branch: payload.fromBranch,
          to_branch: payload.toBranch,
          quantity: payload.quantity,
          unit_price: payload.unitPrice ?? 0
        },
        { headers: buildActorHeaders(actor) }
      );

      const record: TransferRequest = {
        ...payload,
        id: String(data.data?.id ?? `TR-${Date.now()}`),
        status: data.data?.status ?? "PENDING",
        totalPrice: payload.totalPrice ?? (payload.unitPrice ?? 0) * payload.quantity,
        createdAt: data.data?.created_at ?? new Date().toISOString()
      };

      set({
        transfers: [record, ...get().transfers],
        transactions: [
          {
            id: `TX-TR-${record.id}`,
            materialId: payload.itemId,
            materialName: currentItem?.materialName ?? currentItem?.name,
            category: currentItem?.category,
            brand: currentItem?.brand,
            unit: currentItem?.unit,
            branch: payload.fromBranch,
            transactionType: "TRANSFER",
            quantity: payload.quantity,
            unitPrice: payload.unitPrice ?? 0,
            totalPrice: payload.totalPrice ?? (payload.unitPrice ?? 0) * payload.quantity,
            notes: `Transfer ke ${payload.toBranch}`,
            createdAt: record.createdAt
          },
          ...get().transactions
        ]
      });
    } catch (error) {
      throw new Error(extractApiMessage(error, "Gagal membuat transfer stock."));
    }
  },
  approveTransfer: async (id) => {
    const actor = useAuthStore.getState().user;
    await apiClient.post(`/stock-transfers/${id}/approve`, {}, { headers: buildActorHeaders(actor) });
    set({
      transfers: get().transfers.map((transfer) =>
        transfer.id === id ? { ...transfer, status: "APPROVED" } : transfer
      )
    });
  },
  createPurchaseRequest: async (payload) => {
    const actor = useAuthStore.getState().user;
    const currentItem = get().items.find((item) => item.id === payload.materialId);
    try {
      const { data } = await apiClient.post(
        "/purchase-requests",
        {
          material_id: payload.materialId,
          branch_id: payload.branchId,
          quantity: payload.quantity,
          estimated_price: payload.estimatedPrice,
          supplier: payload.supplier,
          notes: payload.notes
        },
        { headers: buildActorHeaders(actor) }
      );

      const request: PurchaseRequest = {
        ...mapPurchaseRequest(data.data ?? {}, {
          materialId: payload.materialId,
          materialName: currentItem?.materialName ?? currentItem?.name ?? "-",
          branchId: payload.branchId,
          branchName: actor?.branchName ?? "-",
          requestedBy: actor?.id ?? "",
          requestedByName: actor?.name ?? "-",
          quantity: payload.quantity,
          estimatedPrice: payload.estimatedPrice,
          supplier: payload.supplier ?? null,
          notes: payload.notes ?? null,
          status: "pending"
        })
      };

      set({ purchaseRequests: [request, ...get().purchaseRequests] });
    } catch (error) {
      throw new Error(extractApiMessage(error, "Gagal membuat purchase request."));
    }
  },
  approvePurchaseRequest: async (id) => {
    const actor = useAuthStore.getState().user;
    try {
      const currentRequest = get().purchaseRequests.find((request) => request.id === id);
      const { data } = await apiClient.post(`/purchase-requests/${id}/approve`, {}, { headers: buildActorHeaders(actor) });
      const updatedRequest = mapPurchaseRequest(data.data ?? {}, currentRequest);

      set({
        purchaseRequests: get().purchaseRequests.map((request) =>
          request.id === id ? updatedRequest : request
        )
      });
    } catch (error) {
      throw new Error(extractApiMessage(error, "Gagal menyetujui purchase request."));
    }
  },
  rejectPurchaseRequest: async (id, reason) => {
    const actor = useAuthStore.getState().user;
    try {
      const currentRequest = get().purchaseRequests.find((request) => request.id === id);
      const { data } = await apiClient.post(`/purchase-requests/${id}/reject`, { reason }, { headers: buildActorHeaders(actor) });
      const updatedRequest = mapPurchaseRequest(data.data ?? {}, currentRequest);

      set({
        purchaseRequests: get().purchaseRequests.map((request) =>
          request.id === id ? updatedRequest : request
        )
      });
    } catch (error) {
      throw new Error(extractApiMessage(error, "Gagal menolak purchase request."));
    }
  },
  resendPurchaseRequest: async (id) => {
    const actor = useAuthStore.getState().user;
    try {
      const currentRequest = get().purchaseRequests.find((request) => request.id === id);
      const { data } = await apiClient.post(`/purchase-requests/${id}/resend`, {}, { headers: buildActorHeaders(actor) });
      const updatedRequest = mapPurchaseRequest(data.data ?? {}, currentRequest);

      set({
        purchaseRequests: get().purchaseRequests.map((request) =>
          request.id === id ? updatedRequest : request
        )
      });
    } catch (error) {
      throw new Error(extractApiMessage(error, "Gagal mengirim ulang purchase request."));
    }
  },
  fetchWarehouseTransactions: async (type) => {
    const history = await get().fetchWarehouseHistory(type);
    return history.rows;
  },
  fetchWarehouseHistory: async (type) => {
    const actor = useAuthStore.getState().user;
    try {
      console.log("WAREHOUSE HISTORY FETCH", { type: type ?? "all" });
      const { data } = await apiClient.get("/warehouse/transactions", {
        params: { type, per_page: 100 },
        headers: buildActorHeaders(actor)
      });
      const rows = Array.isArray(data.data?.data) ? data.data.data : [];
      const totalsSource = data.data?.totals as Record<string, unknown> | undefined;

      return {
        rows: rows.map((row: Record<string, unknown>) => mapWarehouseTransaction(row)),
        totals: {
          quantity: Number(totalsSource?.quantity ?? 0),
          value: Number(totalsSource?.value ?? 0),
        }
      };
    } catch (error) {
      throw new Error(extractApiMessage(error, "Gagal memuat riwayat transaksi gudang."));
    }
  },
  createWarehouseTransaction: async (payload) => {
    const actor = useAuthStore.getState().user;
    const normalizedPayload = {
      ...payload,
      materialId: payload.materialId?.trim?.() ?? payload.materialId,
      sourceBranch: payload.sourceBranch?.trim() || undefined,
      destinationBranch: payload.destinationBranch?.trim() || undefined,
      technicianId: payload.technicianId?.trim() || undefined,
      technicianName: payload.technicianName?.trim() || undefined,
      supplier: payload.supplier?.trim() || undefined,
      customer: payload.customer?.trim() || undefined,
      ticketId: payload.ticketId?.trim() || undefined,
      purchaseRequestId: payload.purchaseRequestId?.trim() || undefined,
      condition: payload.condition?.trim() || undefined,
      status: payload.status?.trim() || undefined,
      notes: payload.notes?.trim() || undefined,
    };

    const technicianRequiredTypes: WarehouseTransactionType[] = [
      "pengeluaran_teknisi",
      "pengembalian_teknisi",
      "technician_out",
      "technician_return",
    ];

    if (!normalizedPayload.materialId) {
      throw new Error("Material wajib dipilih.");
    }

    if (!Number.isFinite(normalizedPayload.quantity) || normalizedPayload.quantity < 1) {
      throw new Error("Quantity harus lebih dari 0.");
    }

    if (technicianRequiredTypes.includes(normalizedPayload.transactionType) && !normalizedPayload.technicianId) {
      throw new Error("Teknisi wajib dipilih untuk transaksi material teknisi.");
    }

    if (technicianRequiredTypes.includes(normalizedPayload.transactionType) && !normalizedPayload.ticketId) {
      throw new Error("Ticket wajib dipilih untuk transaksi material teknisi.");
    }

    if (normalizedPayload.transactionType === "antar_gudang_out" && !normalizedPayload.destinationBranch) {
      throw new Error("Destination branch wajib diisi.");
    }

    if (normalizedPayload.transactionType === "antar_gudang_in" && !normalizedPayload.sourceBranch) {
      throw new Error("Source branch wajib diisi.");
    }

    if (normalizedPayload.transactionType === "pembelian_material" && !normalizedPayload.supplier) {
      throw new Error("Supplier wajib diisi.");
    }

    if (normalizedPayload.transactionType === "penjualan_material" && !normalizedPayload.customer) {
      throw new Error("Customer wajib diisi.");
    }

    try {
      console.log("WAREHOUSE TRANSACTION SUBMIT", normalizedPayload);
      const { data } = await apiClient.post(
        "/warehouse/transactions",
        {
          material_id: normalizedPayload.materialId,
          transaction_type: normalizedPayload.transactionType,
          quantity: normalizedPayload.quantity,
          unit_price: normalizedPayload.unitPrice,
          source_branch: normalizedPayload.sourceBranch,
          destination_branch: normalizedPayload.destinationBranch,
          technician_id: normalizedPayload.technicianId,
          technician_name: normalizedPayload.technicianName,
          supplier: normalizedPayload.supplier,
          customer: normalizedPayload.customer,
          ticket_id: normalizedPayload.ticketId,
          purchase_request_id: normalizedPayload.purchaseRequestId,
          condition: normalizedPayload.condition,
          status: normalizedPayload.status,
          notes: normalizedPayload.notes,
        },
        { headers: buildActorHeaders(actor) }
      );
      console.log("WAREHOUSE TRANSACTION SUCCESS", data);

      const transaction = mapWarehouseTransaction(data.data ?? {});
      const isOutbound = ["antar_gudang_out", "pengeluaran_teknisi", "penjualan_material"].includes(normalizedPayload.transactionType);

      set({
        items: get().items.map((item) =>
          item.id === normalizedPayload.materialId
            ? {
                ...item,
                quantity: isOutbound
                  ? Math.max(0, item.quantity - normalizedPayload.quantity)
                  : item.quantity + normalizedPayload.quantity,
                status: (isOutbound
                  ? Math.max(0, item.quantity - normalizedPayload.quantity)
                  : item.quantity + normalizedPayload.quantity) <= item.minimum ? "LOW_STOCK" : "NORMAL"
              }
            : item
        ),
        transactions: [
          {
            id: `WH-${transaction.id}`,
            materialId: transaction.materialId,
            materialName: transaction.materialName,
            unit: transaction.unit ?? undefined,
            branch: transaction.destinationBranch ?? transaction.sourceBranch ?? actor?.branchName ?? "-",
            transactionType: isOutbound ? (normalizedPayload.transactionType === "antar_gudang_out" ? "TRANSFER" : "OUT") : (normalizedPayload.transactionType === "pengembalian_teknisi" ? "RETURN" : "IN"),
            quantity: transaction.quantity,
            unitPrice: transaction.unitPrice,
            totalPrice: transaction.totalPrice,
            notes: transaction.notes ?? undefined,
            createdAt: transaction.createdAt
          },
          ...get().transactions
        ]
      });

      return transaction;
    } catch (error) {
      console.error("WAREHOUSE TRANSACTION ERROR", error);
      throw new Error(extractApiMessage(error, "Gagal menyimpan transaksi gudang."));
    }
  },
  performStockAudit: async (payload) => {
    const actor = useAuthStore.getState().user;
    const currentItem = get().items.find((item) => item.id === payload.materialId);
    try {
      const { data } = await apiClient.post(
        "/stock-audits",
        {
          material_id: payload.materialId,
          branch_id: payload.branchId,
          physical_stock: payload.physicalStock,
          unit_price: payload.unitPrice,
          notes: payload.notes
        },
        { headers: buildActorHeaders(actor) }
      );

      const audit: StockAudit = {
        id: String(data.data.id),
        materialId: String(data.data.material_id),
        materialName: data.data.material_name ?? currentItem?.materialName ?? currentItem?.name ?? "-",
        branchId: String(data.data.branch_id),
        branchName: data.data.branch_name ?? actor?.branchName ?? "-",
        systemStock: Number(data.data.system_stock ?? currentItem?.quantity ?? 0),
        physicalStock: Number(data.data.physical_stock ?? payload.physicalStock),
        difference: Number(data.data.difference ?? 0),
        unitPrice: Number(data.data.unit_price ?? payload.unitPrice),
        totalDifferenceValue: Number(data.data.total_difference_value ?? 0),
        notes: data.data.notes ?? payload.notes ?? null,
        createdBy: String(data.data.created_by ?? actor?.id ?? ""),
        createdByName: data.data.created_by_name ?? actor?.name ?? "-",
        status: data.data.status ?? "pending",
        canCreateLoss: Boolean(data.data.can_create_loss),
        createdAt: data.data.created_at ?? new Date().toISOString()
      };

      set({ stockAudits: [audit, ...get().stockAudits] });
    } catch (error) {
      throw new Error(extractApiMessage(error, "Gagal membuat stock audit."));
    }
  },
  approveStockAudit: async (id) => {
    const actor = useAuthStore.getState().user;
    const audit = get().stockAudits.find((item) => item.id === id);
    try {
      await apiClient.post(`/stock-audits/${id}/approve`, {}, { headers: buildActorHeaders(actor) });
      set({
        stockAudits: get().stockAudits.map((item) =>
          item.id === id ? { ...item, status: "approved" } : item
        ),
        items: get().items.map((item) =>
          audit && item.id === audit.materialId
            ? {
                ...item,
                quantity: audit.physicalStock,
                status: audit.physicalStock <= item.minimum ? "LOW_STOCK" : "NORMAL"
              }
            : item
        ),
        transactions: audit
          ? [
              {
                id: `TX-AUDIT-${id}`,
                materialId: audit.materialId,
                materialName: audit.materialName,
                branch: audit.branchName,
                transactionType: "AUDIT_ADJUSTMENT",
                quantity: Math.abs(audit.difference),
                unitPrice: audit.unitPrice,
                totalPrice: Math.abs(audit.totalDifferenceValue),
                notes: audit.notes ?? "Audit adjustment",
                createdAt: new Date().toISOString()
              } as StockTransaction,
              ...get().transactions
            ]
          : get().transactions
      });
    } catch (error) {
      throw new Error(extractApiMessage(error, "Gagal menyetujui stock audit."));
    }
  },
  rejectStockAudit: async (id, reason) => {
    const actor = useAuthStore.getState().user;
    try {
      await apiClient.post(`/stock-audits/${id}/reject`, { reason }, { headers: buildActorHeaders(actor) });
      set({
        stockAudits: get().stockAudits.map((audit) =>
          audit.id === id ? { ...audit, status: "rejected", notes: [audit.notes, reason].filter(Boolean).join("\n") } : audit
        )
      });
    } catch (error) {
      throw new Error(extractApiMessage(error, "Gagal menolak stock audit."));
    }
  },
  createLossFromAudit: async (id) => {
    const actor = useAuthStore.getState().user;
    try {
      const { data } = await apiClient.post(`/stock-audits/${id}/loss-report`, {}, { headers: buildActorHeaders(actor) });
      const audit = get().stockAudits.find((item) => item.id === id);
      const report: LossReport = {
        id: String(data.data.id),
        ticketId: "",
        technicianId: String(actor?.id ?? ""),
        technicianName: actor?.name ?? "Warehouse",
        itemId: String(data.data.material_id ?? audit?.materialId ?? ""),
        materialName: audit?.materialName,
        area: audit?.branchName ?? actor?.branchName ?? "Tanpa Area",
        quantityLost: Number(data.data.quantity ?? Math.abs(audit?.difference ?? 0)),
        unitPrice: Number(data.data.unit_price ?? audit?.unitPrice ?? 0),
        totalPrice: Number(data.data.total_price ?? Math.abs(audit?.totalDifferenceValue ?? 0)),
        lossPercent: Number(data.data.loss_percent ?? 0),
        note: data.data.reason ?? audit?.notes ?? "Loss generated from audit.",
        status: data.data.status ?? "MENUNGGU",
        createdAt: data.data.created_at ?? new Date().toISOString()
      };

      set({ losses: [report, ...get().losses] });
    } catch (error) {
      throw new Error(extractApiMessage(error, "Gagal membuat loss report dari audit."));
    }
  },
  submitLossReport: async (payload) => {
    const actor = useAuthStore.getState().user;
    const currentItem = get().items.find((item) => item.id === payload.itemId);
    try {
      const { data } = await apiClient.post(
        "/loss-reports",
        {
          ticket_id: payload.ticketId,
          technician_id: payload.technicianId,
          item_id: payload.itemId,
          quantity_lost: payload.quantityLost,
          loss_percent: payload.lossPercent,
          note: payload.note
        },
        { headers: buildActorHeaders(actor) }
      );

      const report: LossReport = {
        ...payload,
        materialName: payload.materialName ?? currentItem?.materialName ?? currentItem?.name,
        id: String(data.data?.id ?? `LR-${Date.now()}`),
        unitPrice: Number(data.data?.unit_price ?? currentItem?.purchasePrice ?? 0),
        totalPrice: Number(data.data?.total_price ?? (payload.quantityLost * (currentItem?.purchasePrice ?? 0))),
        status: data.data?.status ?? "MENUNGGU",
        createdAt: data.data?.created_at ?? new Date().toISOString()
      };

      set({ losses: [report, ...get().losses] });
    } catch (error) {
      throw new Error(extractApiMessage(error, "Gagal membuat loss report."));
    }
  },
  requestTicketMaterials: async (ticketId, materials) => {
    const actor = useAuthStore.getState().user;
    const isTechnicianRequest = actor?.role === "TEKNISI";
    const invalidRow = materials.find((material) => {
      if (!Number.isFinite(Number(material.quantity)) || Number(material.quantity) < 1) {
        return true;
      }

      if (!isTechnicianRequest && !material.technicianId) {
        return true;
      }

      return false;
    });

    if (invalidRow) {
      throw new Error(isTechnicianRequest ? "Material dan quantity wajib valid." : "Setiap material wajib memiliki technician_id dan quantity valid.");
    }

    try {
      let records: TicketMaterialRequest[] = [];

      if (isTechnicianRequest) {
        const material = materials[0];
        const payload = {
          ticket_id: Number(ticketId),
          material_id: Number(material.materialId),
          quantity: Number(material.quantity),
        };

        console.log("POST /material-requests", payload);

        const { data } = await apiClient.post(
          "/material-requests",
          payload,
          { headers: buildActorHeaders(actor) }
        );

        records = data?.data ? [mapTicketMaterialRequest(data.data as Record<string, unknown>)] : [];
      } else {
        const payload = {
          materials: materials.map((material) => ({
            material_id: Number(material.materialId),
            teknisi_id: Number(material.technicianId),
            quantity: Number(material.quantity),
          })),
        };

        const { data } = await apiClient.post(
          `/tickets/${ticketId}/materials/request`,
          payload,
          { headers: buildActorHeaders(actor) }
        );

        records = Array.isArray(data.data)
          ? data.data.map((row: Record<string, unknown>) => mapTicketMaterialRequest(row))
          : [];
      }

      set({ ticketMaterialRequests: [...records, ...get().ticketMaterialRequests] });
      return records;
    } catch (error) {
      throw new Error(extractApiMessage(error, "Gagal mengirim permintaan material tiket."));
    }
  },
  fetchTicketMaterials: async (ticketId) => {
    const actor = useAuthStore.getState().user;
    const { data } = await apiClient.get("/material-requests", {
      params: { ticket_id: ticketId },
      headers: buildActorHeaders(actor)
    });

    console.log("GET /material-requests response", data);

    const payload = unwrapApiData<Record<string, unknown>[] | null>(data);
    const records = Array.isArray(payload)
      ? payload.map((row: Record<string, unknown>) => mapTicketMaterialRequest(row))
      : [];

    console.log("Parsed material requests", records);

    set({
      ticketMaterialRequests: [
        ...records,
        ...get().ticketMaterialRequests.filter((existing) => existing.ticketId !== ticketId)
      ]
    });

    return records;
  },
  fetchTicketMaterialRequests: async (filters) => {
    const actor = useAuthStore.getState().user;
    const endpoint = actor?.role === "ADMIN_GUDANG" || actor?.role === "MANAGER"
      ? "/warehouse/ticket-material-requests"
      : "/material-requests";

    const { data } = await apiClient.get(endpoint, {
      params: {
        ticket_id: filters?.ticketId,
        status: filters?.status,
      },
      headers: buildActorHeaders(actor)
    });

    const payload = unwrapApiData<Record<string, unknown>[] | null>(data);
    return Array.isArray(payload)
      ? payload.map((row: Record<string, unknown>) => mapTicketMaterialRequestGroup(row))
      : [];
  },
  processMaterialRequest: async (id) => {
    const actor = useAuthStore.getState().user;
    const { data } = await apiClient.post(`/material-requests/${id}/process`, {}, {
      headers: buildActorHeaders(actor),
    });

    const row = unwrapApiData<Record<string, unknown> | null>(data);
    const updated = row ? mapTicketMaterialRequest(row) : null;

    if (!updated) {
      throw new Error("Data request material tidak ditemukan setelah diproses.");
    }

    set({
      ticketMaterialRequests: get().ticketMaterialRequests.map((request) =>
        request.id === updated.id
          ? {
              ...request,
              status: updated.status,
              releasedQuantity: updated.releasedQuantity,
              returnedQuantity: updated.returnedQuantity,
            }
          : request
      ),
    });

    return updated;
  },
  fetchAssignedTechnicianMaterials: async (ticketId) => {
    const actor = useAuthStore.getState().user;
    const { data } = await apiClient.get("/teknisi/materials", {
      params: ticketId ? { ticket_id: ticketId } : undefined,
      headers: buildActorHeaders(actor)
    });

    console.log("GET /teknisi/materials response", data);

    const payload = unwrapApiData<Record<string, unknown>[] | null>(data);
    const records = Array.isArray(payload)
      ? payload.map((row: Record<string, unknown>) => mapAssignedTechnicianMaterial(row))
      : [];

    console.log("Parsed assigned materials", records);

    set({ assignedTechnicianMaterials: records });
    return records;
  },
  releaseTicketMaterials: async (payload) => {
    const actor = useAuthStore.getState().user;
    const normalizedTicketId = Number(payload.ticketId);
    const normalizedMaterials = payload.materials
      .map((row) => ({
        material_id: Number(row.materialId),
        quantity: Number(row.quantity),
        request_id: row.requestId !== undefined ? Number(row.requestId) : undefined,
      }))
      .filter((row) => Number.isFinite(row.material_id) && Number.isFinite(row.quantity) && row.quantity > 0);

    if (!Number.isInteger(normalizedTicketId) || normalizedTicketId <= 0) {
      throw new Error("Ticket wajib dipilih sebelum menyimpan pengeluaran material.");
    }

    if (normalizedMaterials.length === 0) {
      throw new Error("Material belum diisi");
    }

    const requestIds = normalizedMaterials
      .map((row) => row.request_id)
      .filter((value): value is number => value !== undefined && Number.isInteger(value) && value > 0);

    const requestPayload = {
      ticket_id: normalizedTicketId,
      materials: normalizedMaterials,
    };

    console.log("SUBMIT START");
    console.log("PAYLOAD", requestPayload);

    try {
      console.log("API CALLED");
      const { data } = await apiClient.post(
        `/warehouse/tickets/${normalizedTicketId}/release-materials`,
        requestPayload,
        { headers: buildActorHeaders(actor) }
      );
      console.log("API SUCCESS", data);

      const report = mapMaterialReleaseReport(data.data ?? {});

      set({
        items: get().items.map((item) => {
          const matchedRelease = normalizedMaterials.find((row) => String(row.material_id) === item.id);
          if (!matchedRelease) return item;

          const nextQuantity = Math.max(0, item.quantity - matchedRelease.quantity);
          return {
            ...item,
            quantity: nextQuantity,
            status: nextQuantity <= item.minimum ? "LOW_STOCK" : "NORMAL",
          };
        }),
        ticketMaterialRequests: get().ticketMaterialRequests.map((request) => {
          const matched = requestIds.length > 0
            ? normalizedMaterials.find((row) => String(row.request_id) === request.id)
            : normalizedMaterials.find((row) => String(row.material_id) === request.materialId);

          if (!matched) return request;

          const nextReleased = (request.releasedQuantity ?? 0) + matched.quantity;

          return {
            ...request,
            status: "RELEASED",
            releasedQuantity: nextReleased,
          };
        })
      });

      return report;
    } catch (error) {
      console.error("WAREHOUSE RELEASE ERROR", error);
      throw new Error(extractApiMessage(error, "Gagal menyimpan pengeluaran material teknisi."));
    }
  },
  fetchMaterialReleaseReport: async (ticketDbId) => {
    const actor = useAuthStore.getState().user;
    const { data } = await apiClient.get(`/warehouse/tickets/${ticketDbId}/material-release-report`, {
      headers: buildActorHeaders(actor)
    });

    return mapMaterialReleaseReport(data.data ?? {});
  },
  fetchMaterialReturnChecklist: async (ticketDbId) => {
    const actor = useAuthStore.getState().user;
    const { data } = await apiClient.get(`/warehouse/tickets/${ticketDbId}/return-checklist`, {
      headers: buildActorHeaders(actor)
    });

    return mapReturnChecklist(data.data ?? {});
  },
  processMaterialReturns: async (ticketDbId, returns) => {
    const actor = useAuthStore.getState().user;
    const { data } = await apiClient.post(
      `/warehouse/tickets/${ticketDbId}/return-materials`,
      {
        returns: returns.map((row) => ({
          request_id: row.requestId,
          quantity_returned: row.quantityReturned,
        })),
      },
      { headers: buildActorHeaders(actor) }
    );

    const checklist = mapReturnChecklist(data.data ?? {});

    set({
      items: get().items.map((item) => {
        const matchedRequest = get().ticketMaterialRequests.find((request) => request.materialId === item.id && returns.some((row) => row.requestId === request.id));
        const matchedReturn = matchedRequest ? returns.find((row) => row.requestId === matchedRequest.id) : null;
        if (!matchedReturn) return item;

        const nextQuantity = item.quantity + matchedReturn.quantityReturned;
        return {
          ...item,
          quantity: nextQuantity,
          status: nextQuantity <= item.minimum ? "LOW_STOCK" : "NORMAL",
        };
      }),
      ticketMaterialRequests: get().ticketMaterialRequests.map((request) => {
        const matched = returns.find((row) => row.requestId === request.id);
        if (!matched) return request;
        const nextReturned = (request.returnedQuantity ?? 0) + matched.quantityReturned;
        const totalReleased = request.releasedQuantity ?? 0;

        return {
          ...request,
          returnedQuantity: nextReturned,
          status: nextReturned >= totalReleased ? "RETURNED" : "PARTIAL_RETURN",
        };
      })
    });

    return checklist;
  },
  submitMaterialReport: async (payload) => {
    const actor = useAuthStore.getState().user;
    const formData = new FormData();
    formData.append("ticket_id", payload.ticketId);
    formData.append("technician_id", payload.technicianId);
    formData.append("latitude", String(payload.latitude));
    formData.append("longitude", String(payload.longitude));
    formData.append("accuracy", String(payload.accuracy));
    formData.append("device_timestamp", payload.deviceTimestamp ?? new Date().toISOString());

    payload.materials.forEach((material, index) => {
      formData.append(`materials[${index}][material_id]`, material.materialId);
      formData.append(`materials[${index}][used]`, String(material.used));
      formData.append(`materials[${index}][remaining]`, String(material.remaining));

      if (material.existingPhotoPath) {
        formData.append(`materials[${index}][existing_photo_path]`, material.existingPhotoPath);
      }

      if (material.photo) {
        formData.append(`materials[${index}][photo]`, material.photo, `material-${material.materialId}-${Date.now()}.webp`);
      }
    });

    const { data } = await apiClient.post("/tickets/material-report", formData, {
      headers: {
        ...buildActorHeaders(actor),
        "Content-Type": "multipart/form-data"
      }
    });

    const records: TicketMaterialReport[] = Array.isArray(data.data)
      ? data.data.map((row: Record<string, unknown>) => mapTicketMaterialReport(row))
      : [];

    set({
      materialReports: [
        ...records,
        ...get().materialReports.filter(
          (item) => !records.some((record) =>
            record.ticketId === item.ticketId &&
            record.technicianId === item.technicianId &&
            record.materialId === item.materialId
          )
        )
      ],
      assignedTechnicianMaterials: get().assignedTechnicianMaterials.map((item) => {
        const matched = records.find((record) => record.ticketId === item.ticketId && record.materialId === item.materialId);
        return matched
          ? {
              ...item,
              reportedUsed: matched.used,
              reportedRemaining: matched.remaining,
              currentStock: Math.max(0, item.quantityAssigned - matched.used),
              photoPath: matched.photoPath
            }
          : item;
      })
    });

    return records;
  },
  getLowStockCount: () => get().items.filter((item) => item.quantity <= item.minimum).length,
  getMaterialUsageToday: () => {
    const totals = new Map<string, number>();

    get().ticketMaterialRequests
      .filter((item) => item.createdAt.slice(0, 10) === today())
      .forEach((item) => {
        totals.set(item.materialId, (totals.get(item.materialId) ?? 0) + item.qtyRequested);
      });

    return Array.from(totals.entries()).map(([materialId, totalQuantity]) => ({
      materialId,
      totalQuantity
    }));
  },
  getMaterialUsageWeek: () => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const totals = new Map<string, number>();

    get().ticketMaterialRequests
      .filter((item) => new Date(item.createdAt).getTime() >= cutoff)
      .forEach((item) => {
        totals.set(item.materialId, (totals.get(item.materialId) ?? 0) + item.qtyRequested);
      });

    return Array.from(totals.entries()).map(([materialId, totalQuantity]) => ({
      materialId,
      totalQuantity
    }));
  },
  approveLoss: async (id) => {
    const loss = get().losses.find((item) => item.id === id);
    if (!loss) return;

    const actor = useAuthStore.getState().user;
    await apiClient.post(`/loss-reports/${id}/decision`, { decision: "APPROVE" }, { headers: buildActorHeaders(actor) });

    set({
      losses: get().losses.map((item) =>
        item.id === id
          ? { ...item, status: "DISETUJUI", reviewedAt: new Date().toISOString() }
          : item
      ),
      items: get().items.map((item) =>
        item.id === loss.itemId
          ? {
              ...item,
              quantity: Math.max(0, item.quantity - loss.quantityLost),
              status: item.quantity - loss.quantityLost <= item.minimum ? "LOW_STOCK" : "NORMAL"
            }
          : item
      )
    });
  },
  rejectLoss: async (id, reason) => {
    const actor = useAuthStore.getState().user;
    await apiClient.post(`/loss-reports/${id}/decision`, { decision: "REJECT", reason }, { headers: buildActorHeaders(actor) });
    set({
      losses: get().losses.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "DITOLAK",
              rejectedReason: reason,
              reviewedAt: new Date().toISOString()
            }
          : item
      )
    });
  },
  startLossInvestigation: async (id) => {
    const actor = useAuthStore.getState().user;
    await apiClient.post(`/loss-reports/${id}/decision`, { decision: "INVESTIGATE" }, { headers: buildActorHeaders(actor) });
    set({
      losses: get().losses.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "DALAM_INVESTIGASI",
              investigationStatus: "Dalam Investigasi",
              reviewedAt: new Date().toISOString()
            }
          : item
      )
    });
  }
}));
