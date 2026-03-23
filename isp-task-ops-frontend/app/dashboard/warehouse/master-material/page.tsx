"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { useStockStore } from "@/store/useStockStore";
import { useAuthStore } from "@/store/useAuthStore";

const emptyForm = {
  categoryId: "",
  brand: "",
  name: "",
  sku: "",
  unit: "",
  minimumStock: 0,
  stock: 0,
  purchasePrice: 0,
  description: ""
};

type MaterialFormErrors = Partial<Record<"categoryId" | "name" | "sku" | "unit" | "stock" | "minimumStock" | "purchasePrice" | "description" | "branchId", string[]>>;

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900";
const readOnlyClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700";
const descriptionPlaceholder = "Contoh: Catatan tambahan mengenai kondisi material atau transaksi gudang.";

export default function WarehouseMasterMaterialPage() {
  const items = useStockStore((state) => state.items);
  const categories = useStockStore((state) => state.categories);
  const brands = useStockStore((state) => state.brands);
  const transactions = useStockStore((state) => state.transactions);
  const losses = useStockStore((state) => state.losses);
  const stockAudits = useStockStore((state) => state.stockAudits);
  const createMaterial = useStockStore((state) => state.createMaterial);
  const updateMaterial = useStockStore((state) => state.updateMaterial);
  const deleteMaterial = useStockStore((state) => state.deleteMaterial);
  const createPurchaseRequest = useStockStore((state) => state.createPurchaseRequest);
  const fetchMaterialCategories = useStockStore((state) => state.fetchMaterialCategories);
  const user = useAuthStore((state) => state.user);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [purchaseMaterialId, setPurchaseMaterialId] = useState<string>("");
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [purchaseSupplier, setPurchaseSupplier] = useState("");
  const [purchaseNotes, setPurchaseNotes] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<MaterialFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [brandFilter, setBrandFilter] = useState("ALL");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (user?.role === "ADMIN_GUDANG" || user?.role === "MANAGER") {
      void fetchMaterialCategories();
    }
  }, [fetchMaterialCategories, user?.role]);

  useEffect(() => {
    if (!form.categoryId && categories.length > 0) {
      setForm((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories, form.categoryId]);

  useEffect(() => {
    if (!message) return undefined;

    const timeout = window.setTimeout(() => setMessage(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [message]);

  const formBrandOptions = useMemo(
    () => brands.filter((brand) => brand.categoryId === form.categoryId),
    [brands, form.categoryId]
  );

  const filterBrandOptions = useMemo(
    () => (categoryFilter === "ALL" ? brands : brands.filter((brand) => brand.categoryId === categoryFilter)),
    [brands, categoryFilter]
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const categoryMatch = categoryFilter === "ALL" || item.categoryId === categoryFilter;
      const brandMatch = brandFilter === "ALL" || item.brand === brandFilter;
      const searchMatch =
        !query ||
        [item.materialName, item.name, item.category, item.brand, item.sku, item.branch]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      return categoryMatch && brandMatch && searchMatch;
    });
  }, [brandFilter, categoryFilter, items, search]);

  const selectedMaterial = useMemo(
    () => items.find((item) => item.id === selectedId) ?? filteredItems[0] ?? null,
    [filteredItems, items, selectedId]
  );

  const purchaseMaterial = useMemo(
    () => items.find((item) => item.id === purchaseMaterialId) ?? null,
    [items, purchaseMaterialId]
  );

  const resetForm = () => {
    setEditingId(null);
    setFieldErrors({});
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id ?? ""
    });
  };

  const mapFieldErrors = (error: unknown): MaterialFormErrors => {
    const source = (error as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {};

    return {
      branchId: source.branch_id,
      categoryId: source.category_id,
      name: source.name ?? source.material_name,
      sku: source.sku,
      unit: source.unit,
      stock: source.current_stock ?? source.stock,
      minimumStock: source.minimum_stock,
      purchasePrice: source.purchase_price ?? source.price,
      description: source.description,
    };
  };

  const onSubmit = async () => {
    if (!user?.branchId) {
      setMessage("Branch user tidak tersedia.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    setFieldErrors({});

    try {
      if (editingId) {
        const updated = await updateMaterial(editingId, {
          branchId: user.branchId,
          categoryId: form.categoryId,
          brand: form.brand,
          name: form.name,
          sku: form.sku,
          unit: form.unit,
          stock: form.stock,
          minimumStock: form.minimumStock,
          purchasePrice: form.purchasePrice,
          description: form.description
        });
        setSelectedId(updated.id);
        setMessage("Edit Material works.");
      } else {
        const created = await createMaterial({
          branchId: user.branchId,
          categoryId: form.categoryId,
          brand: form.brand,
          name: form.name,
          sku: form.sku,
          unit: form.unit,
          stock: form.stock,
          minimumStock: form.minimumStock,
          purchasePrice: form.purchasePrice,
          description: form.description
        });
        setSelectedId(created.id);
        setMessage("Create Material works.");
      }

      resetForm();
    } catch (error) {
      setFieldErrors(mapFieldErrors(error));
      setMessage(error instanceof Error ? error.message : "Gagal menyimpan material.");
    } finally {
      setSubmitting(false);
    }
  };

  const onEdit = (id: string) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;

    setEditingId(id);
    setSelectedId(id);
    setForm({
      categoryId: item.categoryId ?? "",
      brand: item.brand ?? "",
      name: item.name,
      sku: item.sku,
      unit: item.unit,
      minimumStock: item.minimum,
      stock: item.quantity,
      purchasePrice: item.purchasePrice ?? 0,
      description: item.description ?? ""
    });
    setMessage(`Mengedit ${item.materialName ?? item.name}.`);
    document.getElementById("material-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  const openDeleteModal = (id: string) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;

    setDeleteTarget({
      id,
      name: item.materialName ?? item.name
    });
  };

  const onDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMaterial(deleteTarget.id);
      if (selectedId === deleteTarget.id) setSelectedId(null);
      if (editingId === deleteTarget.id) resetForm();
      setDeleteTarget(null);
      setMessage("Material berhasil dihapus.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menghapus material.");
    }
  };

  const openPurchaseRequest = (id: string) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;

    setPurchaseMaterialId(id);
    setPurchaseQuantity(Math.max(1, item.minimum - item.quantity + 1));
    setPurchaseSupplier("");
    setPurchaseNotes(`Auto request karena stok ${item.quantity} <= minimum ${item.minimum}.`);
    setMessage(`Ajukan pembelian untuk ${item.materialName ?? item.name}.`);
  };

  const onCreatePurchaseRequest = async () => {
    if (!user?.branchId || !purchaseMaterial) {
      setMessage("Material pembelian belum dipilih.");
      return;
    }

    try {
      await createPurchaseRequest({
        materialId: purchaseMaterial.id,
        branchId: user.branchId,
        quantity: purchaseQuantity,
        estimatedPrice: purchaseQuantity * (purchaseMaterial.purchasePrice ?? 0),
        supplier: purchaseSupplier,
        notes: purchaseNotes
      });
      setMessage("Create Purchase Request works.");
      setPurchaseMaterialId("");
      setPurchaseQuantity(1);
      setPurchaseSupplier("");
      setPurchaseNotes("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal membuat purchase request.");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Master Material</h1>

      <div id="material-form" className="ml-0 mr-auto w-full max-w-[1100px]">
        <Card title={editingId ? "Edit Material" : "Create Material"}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="mb-[14px] space-y-1">
              <span className="text-sm font-semibold text-slate-900">Category</span>
              <select className={`tap-target ${inputClass}`} value={form.categoryId} onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {fieldErrors.categoryId?.[0] ? <p className="text-xs text-red-600">{fieldErrors.categoryId[0]}</p> : null}
            </label>

            <label className="mb-[14px] space-y-1">
              <span className="text-sm font-semibold text-slate-900">Brand</span>
              <input
                list="material-brand-options"
                className={`tap-target ${inputClass}`}
                placeholder="Ketik brand atau pilih brand tersedia"
                value={form.brand}
                onChange={(event) => setForm((prev) => ({ ...prev, brand: event.target.value }))}
              />
              <datalist id="material-brand-options">
                {formBrandOptions.map((brand) => (
                  <option key={brand.id} value={brand.name} />
                ))}
              </datalist>
            </label>

            <label className="mb-[14px] space-y-1">
              <span className="text-sm font-semibold text-slate-900">Material Name</span>
              <input className={`tap-target ${inputClass}`} placeholder="Contoh: ONT Huawei HG8245H" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
              {fieldErrors.name?.[0] ? <p className="text-xs text-red-600">{fieldErrors.name[0]}</p> : null}
            </label>

            <label className="mb-[14px] space-y-1">
              <span className="text-sm font-semibold text-slate-900">SKU</span>
              <input className={`tap-target ${inputClass}`} placeholder="Contoh: ONT-HUAWEI-HG8245H" value={form.sku} onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))} />
              {fieldErrors.sku?.[0] ? <p className="text-xs text-red-600">{fieldErrors.sku[0]}</p> : null}
            </label>

            <label className="mb-[14px] space-y-1">
              <span className="text-sm font-semibold text-slate-900">Unit</span>
              <input className={`tap-target ${inputClass}`} placeholder="pcs / meter" value={form.unit} onChange={(event) => setForm((prev) => ({ ...prev, unit: event.target.value }))} />
              {fieldErrors.unit?.[0] ? <p className="text-xs text-red-600">{fieldErrors.unit[0]}</p> : null}
            </label>

            <label className="mb-[14px] space-y-1">
              <span className="text-sm font-semibold text-slate-900">Minimum Stock</span>
              <input type="number" min={0} className={`tap-target ${inputClass}`} value={form.minimumStock} onChange={(event) => setForm((prev) => ({ ...prev, minimumStock: Number(event.target.value) }))} />
              {fieldErrors.minimumStock?.[0] ? <p className="text-xs text-red-600">{fieldErrors.minimumStock[0]}</p> : null}
            </label>

            <label className="mb-[14px] space-y-1">
              <span className="text-sm font-semibold text-slate-900">Current Stock</span>
              <input type="number" min={0} className={`tap-target ${inputClass}`} value={form.stock} onChange={(event) => setForm((prev) => ({ ...prev, stock: Number(event.target.value) }))} />
              {fieldErrors.stock?.[0] ? <p className="text-xs text-red-600">{fieldErrors.stock[0]}</p> : null}
            </label>

            <label className="mb-[14px] space-y-1">
              <span className="text-sm font-semibold text-slate-900">Purchase Price</span>
              <input type="number" min={0} className={`tap-target ${inputClass}`} value={form.purchasePrice} onChange={(event) => setForm((prev) => ({ ...prev, purchasePrice: Number(event.target.value) }))} />
              {fieldErrors.purchasePrice?.[0] ? <p className="text-xs text-red-600">{fieldErrors.purchasePrice[0]}</p> : null}
            </label>

            <label className="mb-[14px] md:col-span-2">
              <span className="mb-[6px] block text-sm font-semibold text-slate-900">Description</span>
              <textarea
                rows={4}
                className="block min-h-[90px] w-full resize-y rounded-lg border border-[#d1d5db] bg-white px-[10px] py-[10px] text-sm text-slate-900"
                placeholder={descriptionPlaceholder}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              />
              {fieldErrors.description?.[0] ? <p className="mt-1 text-xs text-red-600">{fieldErrors.description[0]}</p> : null}
            </label>

            <div className="flex flex-wrap gap-2 md:col-span-2">
              <Button type="button" className="px-4 py-2 text-sm" onClick={onSubmit} disabled={submitting}>
                {submitting ? "Menyimpan..." : editingId ? "Update Material" : "Create Material"}
              </Button>
              <Button type="button" variant="secondary" className="px-4 py-2 text-sm" onClick={resetForm}>
                Reset
              </Button>
            </div>
          </div>
          {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
          {fieldErrors.branchId?.[0] ? <p className="mt-2 text-sm text-red-600">{fieldErrors.branchId[0]}</p> : null}
        </Card>
      </div>

      <Card title="Material List">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <input className={`tap-target ${inputClass}`} placeholder="Search material / SKU / brand" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select className={`tap-target ${inputClass}`} value={categoryFilter} onChange={(event) => {
            setCategoryFilter(event.target.value);
            setBrandFilter("ALL");
          }}>
            <option value="ALL">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <select className={`tap-target ${inputClass}`} value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)}>
            <option value="ALL">All Brands</option>
            {filterBrandOptions.map((brand) => (
              <option key={brand.id} value={brand.name}>{brand.name}</option>
            ))}
          </select>
        </div>

        <div className="hidden md:block">
          <Table
            data={filteredItems}
            enableSearch={false}
            emptyText="Belum ada material."
            columns={[
              { header: "Material", key: "material", className: "w-[220px]", render: (row) => <span className="block overflow-hidden text-ellipsis whitespace-nowrap font-semibold">{row.materialName ?? row.name}</span> },
              { header: "Category", key: "category", className: "w-[140px]", render: (row) => <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{row.category ?? "-"}</span> },
              { header: "Brand", key: "brand", className: "w-[140px]", render: (row) => <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{row.brand ?? "-"}</span> },
              { header: "Stock", key: "stock", className: "w-[90px]", render: (row) => <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{row.quantity}</span> },
              { header: "Unit", key: "unit", className: "w-[80px]", render: (row) => <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{row.unit}</span> },
              { header: "Price", key: "price", className: "w-[120px]", render: (row) => <span className="block overflow-hidden text-ellipsis whitespace-nowrap">Rp {Number(row.purchasePrice ?? 0).toLocaleString("id-ID")}</span> },
              {
                header: "Status",
                key: "status",
                className: "w-[120px]",
                render: (row) => <Badge tone={(row.status ?? "NORMAL") === "LOW_STOCK" ? "danger" : "success"}>{(row.status ?? "NORMAL") === "LOW_STOCK" ? "LOW STOCK" : "TERSEDIA"}</Badge>
              },
              {
                header: "Actions",
                key: "actions",
                className: "w-[140px]",
                render: (row) => (
                  <div className="flex items-center gap-1.5">
                    <IconActionButton className="h-[34px] w-[34px]" icon={<Pencil size={15} />} label="Edit" onClick={() => onEdit(row.id)} />
                    <IconActionButton className="h-[34px] w-[34px]" icon={<Trash size={15} />} label="Delete" tone="danger" onClick={() => openDeleteModal(row.id)} />
                  </div>
                )
              }
            ]}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:hidden">
          {filteredItems.length > 0 ? filteredItems.map((item) => (
            <div key={item.id} className="rounded-[10px] border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-bold text-slate-900">{item.materialName ?? item.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.category ?? "-"} · {item.brand ?? "-"}</p>
                </div>
                <Badge tone={(item.status ?? "NORMAL") === "LOW_STOCK" ? "danger" : "success"}>
                  {(item.status ?? "NORMAL") === "LOW_STOCK" ? "LOW STOCK" : "NORMAL"}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700">
                <div><span className="block text-xs uppercase tracking-wide text-slate-500">Stock</span>{item.quantity}</div>
                <div><span className="block text-xs uppercase tracking-wide text-slate-500">Unit</span>{item.unit}</div>
                <div><span className="block text-xs uppercase tracking-wide text-slate-500">Price</span>Rp {Number(item.purchasePrice ?? 0).toLocaleString("id-ID")}</div>
                <div><span className="block text-xs uppercase tracking-wide text-slate-500">Status</span>{(item.status ?? "NORMAL") === "LOW_STOCK" ? "LOW STOCK" : "TERSEDIA"}</div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                <IconActionButton className="h-[34px] w-[34px]" icon={<Pencil size={15} />} label="Edit" onClick={() => onEdit(item.id)} />
                <IconActionButton className="h-[34px] w-[34px]" icon={<Trash size={15} />} label="Delete" tone="danger" onClick={() => openDeleteModal(item.id)} />
              </div>
            </div>
          )) : <p className="text-sm text-slate-500">Belum ada material.</p>}
        </div>
      </Card>

      {purchaseMaterial ? (
        <Card title="Ajukan Pembelian">
          <div className="ml-0 mr-auto grid w-full max-w-[1100px] grid-cols-1 gap-4 md:grid-cols-2">
            <label className="mb-[14px] space-y-1">
              <span className="text-sm font-semibold text-slate-900">Material</span>
              <input className={readOnlyClass} value={purchaseMaterial.materialName ?? purchaseMaterial.name} readOnly />
            </label>
            <label className="mb-[14px] space-y-1">
              <span className="text-sm font-semibold text-slate-900">Estimated Price</span>
              <input className={readOnlyClass} value={`Rp ${(purchaseQuantity * (purchaseMaterial.purchasePrice ?? 0)).toLocaleString("id-ID")}`} readOnly />
            </label>
            <label className="mb-[14px] space-y-1">
              <span className="text-sm font-semibold text-slate-900">Quantity</span>
              <input type="number" min={1} className={`tap-target ${inputClass}`} value={purchaseQuantity} onChange={(event) => setPurchaseQuantity(Number(event.target.value))} />
            </label>
            <label className="mb-[14px] space-y-1">
              <span className="text-sm font-semibold text-slate-900">Supplier</span>
              <input className={`tap-target ${inputClass}`} value={purchaseSupplier} onChange={(event) => setPurchaseSupplier(event.target.value)} />
            </label>
            <label className="mb-[14px] md:col-span-2">
              <span className="mb-[6px] block text-sm font-semibold text-slate-900">Description</span>
              <textarea rows={4} className="block min-h-[90px] w-full resize-y rounded-lg border border-[#d1d5db] bg-white px-[10px] py-[10px] text-sm text-slate-900" placeholder={descriptionPlaceholder} value={purchaseNotes} onChange={(event) => setPurchaseNotes(event.target.value)} />
            </label>
            <div className="flex gap-2 md:col-span-2">
              <Button type="button" className="px-4 py-2 text-sm" onClick={() => void onCreatePurchaseRequest()}>
                Submit Purchase Request
              </Button>
              <Button type="button" variant="secondary" className="px-4 py-2 text-sm" onClick={() => setPurchaseMaterialId("")}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <Card title="Material Detail">
        {selectedMaterial ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Material</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{selectedMaterial.materialName ?? selectedMaterial.name}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Purchase Price</p>
              <p className="mt-1 text-lg font-bold text-slate-900">Rp {Number(selectedMaterial.purchasePrice ?? 0).toLocaleString("id-ID")}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">SKU</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{selectedMaterial.sku}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stock Status</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{selectedMaterial.status === "LOW_STOCK" ? "LOW STOCK" : "NORMAL"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</p>
              <p className="mt-1 text-sm text-slate-700">{selectedMaterial.description || "Tidak ada deskripsi material."}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Pilih material untuk melihat detail.</p>
        )}
      </Card>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Konfirmasi Hapus</h2>
            <p className="mt-2 text-sm text-slate-600">Apakah yakin menghapus item ini sekarang?</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" className="px-4 py-2 text-sm text-slate-700" onClick={() => setDeleteTarget(null)}>
                Batal
              </Button>
              <Button type="button" className="bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700" onClick={() => void onDelete()}>
                Hapus
              </Button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
