"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SmartSearch } from "@/components/search/SmartSearch";
import { Table } from "@/components/ui/Table";
import { fuzzySearch } from "@/lib/search/fuzzySearch";
import { TechnicianSelector } from "@/components/technician/TechnicianSelector";
import { useStockStore } from "@/store/useStockStore";
import { useTicketStore } from "@/store/useTicketStore";

interface MaterialDraftItem {
  id: string;
  materialId: string;
  technicianId: string;
  quantity: number;
}

export function AssignTicketForm() {
  const tickets = useTicketStore((state) => state.tickets);
  const technicians = useTicketStore((state) => state.technicians);
  const assignTicket = useTicketStore((state) => state.assignTicket);
  const fetchTickets = useTicketStore((state) => state.fetchTickets);
  const materials = useStockStore((state) => state.items);

  const queueTickets = useMemo(
    () => tickets.filter((ticket) => ["CREATED", "NEW"].includes(String(ticket.status ?? "").toUpperCase())),
    [tickets]
  );

  const [selectedTicketId, setSelectedTicketId] = useState(queueTickets[0]?.id ?? "");
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
  const [materialQuery, setMaterialQuery] = useState("");
  const [draftTechnicianId, setDraftTechnicianId] = useState("");
  const [draftMaterialId, setDraftMaterialId] = useState("");
  const [draftQuantity, setDraftQuantity] = useState(1);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [materialsDraft, setMaterialsDraft] = useState<MaterialDraftItem[]>([]);
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void fetchTickets({ status: "new" })
      .then((rows) => {
        console.log("tickets", rows);
      })
      .catch((error) => {
        setSubmitMessage(error instanceof Error ? error.message : "Data ticket gagal dimuat.");
      });
  }, [fetchTickets]);

  const assignedTechnicianOptions = useMemo(
    () => technicians.filter((technician) => selectedTechnicians.includes(technician.id)),
    [selectedTechnicians, technicians]
  );

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId),
    [selectedTicketId, tickets]
  );

  const selectedTicketIsAssignable = ["CREATED", "NEW"].includes(String(selectedTicket?.status ?? "").toUpperCase());

  const filteredMaterials = useMemo(
    () => fuzzySearch(materials, materialQuery, ["name", "sku", "barcode"]),
    [materials, materialQuery]
  );

  const selectedMaterial = useMemo(
    () => materials.find((item) => item.id === draftMaterialId),
    [draftMaterialId, materials]
  );

  const draftRows = useMemo(
    () => materialsDraft.map((row) => {
      const material = materials.find((item) => item.id === row.materialId);
      const technician = technicians.find((item) => item.id === row.technicianId);

      return {
        id: row.id,
        material: material ? `${material.name} (${material.sku})` : row.materialId,
        technician: technician?.name ?? "-",
        quantity: material ? `${row.quantity} ${material.unit}` : String(row.quantity),
      };
    }),
    [materialsDraft, materials, technicians]
  );

  useEffect(() => {
    if (queueTickets.length === 0) {
      setSelectedTicketId("");
      return;
    }

    if (!queueTickets.some((ticket) => ticket.id === selectedTicketId)) {
      setSelectedTicketId(queueTickets[0].id);
    }
  }, [queueTickets, selectedTicketId]);

  useEffect(() => {
    setSelectedTechnicians([]);
    setMaterialsDraft([]);
    setDraftTechnicianId("");
    setEditingDraftId(null);
    setDraftQuantity(1);
  }, [selectedTicketId]);

  useEffect(() => {
    if (assignedTechnicianOptions.length === 0) {
      setDraftTechnicianId("");
      setMaterialsDraft([]);
      setEditingDraftId(null);
      return;
    }

    if (!assignedTechnicianOptions.some((item) => item.id === draftTechnicianId)) {
      setDraftTechnicianId(assignedTechnicianOptions[0].id);
    }

    setMaterialsDraft((current) =>
      current.filter((row) => assignedTechnicianOptions.some((technician) => technician.id === row.technicianId))
    );
  }, [assignedTechnicianOptions, draftTechnicianId]);

  useEffect(() => {
    if (!draftMaterialId && filteredMaterials[0]) {
      setDraftMaterialId(filteredMaterials[0].id);
    }

    if (draftMaterialId && !materials.some((item) => item.id === draftMaterialId)) {
      setDraftMaterialId(filteredMaterials[0]?.id ?? "");
    }
  }, [draftMaterialId, filteredMaterials, materials]);

  const resetDraftInputs = () => {
    setEditingDraftId(null);
    setDraftQuantity(1);
    setDraftMaterialId(filteredMaterials[0]?.id ?? materials[0]?.id ?? "");
  };

  const onAddTechnician = (technicianId: string) => {
    if (!selectedTicketId) {
      return { ok: false, message: "Pilih tiket terlebih dahulu." };
    }

    if (selectedTechnicians.length >= 5) {
      return { ok: false, message: "Maksimal 5 teknisi per tiket." };
    }

    if (selectedTechnicians.includes(technicianId)) {
      return { ok: false, message: "Teknisi sudah ditambahkan." };
    }

    setSelectedTechnicians((prev) => [...prev, technicianId]);
    return { ok: true };
  };

  const onRemoveTechnician = (technicianId: string) => {
    const technician = technicians.find((item) => item.id === technicianId);

    setSelectedTechnicians((prev) => prev.filter((item) => item !== technicianId));
    if (technician) {
      setMaterialsDraft((current) => current.filter((row) => row.technicianId !== technician.id));
      if (draftTechnicianId === technician.id) {
        setDraftTechnicianId("");
      }
    }
  };

  const onSaveDraft = () => {
    if (!draftTechnicianId) {
      setSubmitMessage("Pilih teknisi untuk material ini.");
      return;
    }

    if (!draftMaterialId) {
      setSubmitMessage("Pilih material terlebih dahulu.");
      return;
    }

    if (!Number.isFinite(draftQuantity) || draftQuantity < 1) {
      setSubmitMessage("Jumlah material minimal 1.");
      return;
    }

    const duplicate = materialsDraft.find((row) => row.materialId === draftMaterialId && row.technicianId === draftTechnicianId && row.id !== editingDraftId);
    if (duplicate) {
      setSubmitMessage("Material untuk teknisi tersebut sudah ada. Gunakan edit jika ingin mengubah.");
      return;
    }

    const nextRow: MaterialDraftItem = {
      id: editingDraftId ?? `draft-${Date.now()}`,
      materialId: draftMaterialId,
      technicianId: draftTechnicianId,
      quantity: Math.max(1, Math.floor(draftQuantity)),
    };

    setMaterialsDraft((current) => {
      if (editingDraftId) {
        return current.map((row) => (row.id === editingDraftId ? nextRow : row));
      }

      return [...current, nextRow];
    });

    setSubmitMessage(editingDraftId ? "Draft material berhasil diperbarui." : "Draft material berhasil ditambahkan.");
    resetDraftInputs();
  };

  const onEditDraft = (id: string) => {
    const row = materialsDraft.find((item) => item.id === id);
    if (!row) {
      return;
    }

    setEditingDraftId(row.id);
    setDraftMaterialId(row.materialId);
    setDraftTechnicianId(row.technicianId);
    setDraftQuantity(row.quantity);
    setSubmitMessage("Mode edit draft material aktif.");
  };

  const onDeleteDraft = (id: string) => {
    setMaterialsDraft((current) => current.filter((row) => row.id !== id));
    if (editingDraftId === id) {
      resetDraftInputs();
    }
    setSubmitMessage("Draft material dihapus.");
  };

  const onSubmitAssignment = async () => {
    if (!selectedTicketId) {
      setSubmitMessage("Pilih tiket terlebih dahulu.");
      return;
    }

    if (!selectedTicketIsAssignable) {
      setSubmitMessage("Ticket sudah ditugaskan.");
      return;
    }

    if (selectedTechnicians.length === 0) {
      setSubmitMessage("Pilih minimal 1 teknisi.");
      return;
    }

    if (materialsDraft.length === 0) {
      setSubmitMessage("Tambahkan minimal satu draft material per teknisi.");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const assignment = await assignTicket({
        ticketId: selectedTicketId,
        priority: selectedTicket?.priority ?? "MEDIUM",
        technicians: selectedTechnicians,
        materials: materialsDraft.map((item) => ({
          materialId: item.materialId,
          technicianId: item.technicianId,
          quantity: item.quantity,
        })),
      });
      if (!assignment.ok) {
        setSubmitMessage(assignment.message);
        setIsSubmitting(false);
        return;
      }

      setSubmitMessage("Tiket ditugaskan dan material berhasil disimpan per teknisi.");
      setSelectedTechnicians([]);
      setMaterialsDraft([]);
      setDraftTechnicianId("");
      setDraftMaterialId(materials[0]?.id ?? "");
      setDraftQuantity(1);
      setEditingDraftId(null);
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : "Gagal menyimpan penugasan dan material.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card title="Penugasan Teknisi">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-semibold">Pilih Tiket</label>
            <select
              className="tap-target w-full rounded-md border border-gray-300 bg-white"
              value={selectedTicketId}
              onChange={(event) => setSelectedTicketId(event.target.value)}
            >
              {queueTickets.length === 0 ? <option value="">Tidak ada ticket baru. Silakan buat ticket terlebih dahulu.</option> : null}
              {queueTickets.map((ticket) => (
                <option key={ticket.id} value={ticket.id}>{ticket.id} - {ticket.title || ticket.branch}</option>
              ))}
            </select>
            {queueTickets.length === 0 ? (
              <p className="mt-2 text-sm text-gray-600">Tidak ada ticket baru. Silakan buat ticket terlebih dahulu.</p>
            ) : null}
          </div>

          <TechnicianSelector
            technicians={technicians.map((technician) => ({ id: technician.id, name: technician.name }))}
            selectedTechnicians={selectedTechnicians}
            onAddTechnician={onAddTechnician}
            onRemoveTechnician={onRemoveTechnician}
          />
          {!selectedTicketIsAssignable && selectedTicketId ? (
            <p className="text-sm text-danger">Ticket sudah ditugaskan.</p>
          ) : null}
        </div>
      </Card>

      <Card title="Draft Material Per Teknisi">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_140px_auto]">
            <div>
              <label className="mb-1 block text-sm font-semibold">Teknisi</label>
              <select
                className="tap-target w-full rounded-md border border-gray-300 bg-white"
                value={draftTechnicianId}
                onChange={(event) => setDraftTechnicianId(event.target.value)}
                disabled={!selectedTicketId || !selectedTicketIsAssignable}
              >
                <option value="">Pilih Teknisi</option>
                {assignedTechnicianOptions.map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">Material</label>
              <select
                className="tap-target w-full rounded-md border border-gray-300 bg-white"
                value={draftMaterialId}
                onChange={(event) => setDraftMaterialId(event.target.value)}
                disabled={!selectedTicketId || !selectedTicketIsAssignable}
              >
                <option value="">Pilih Material</option>
                {materials.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.sku}) - Stok {item.quantity} {item.unit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">Qty</label>
              <input
                type="number"
                min={1}
                className="tap-target w-full rounded-md border border-gray-300 bg-white"
                value={draftQuantity}
                onChange={(event) => setDraftQuantity(Number(event.target.value))}
                disabled={!selectedTicketId || !selectedTicketIsAssignable}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button type="button" variant="secondary" onClick={onSaveDraft} disabled={!selectedTicketId || !selectedTicketIsAssignable || !draftTechnicianId || !draftMaterialId}>
                {editingDraftId ? "Update" : "Add"}
              </Button>
              {editingDraftId ? (
                <Button type="button" variant="secondary" onClick={resetDraftInputs}>
                  Batal
                </Button>
              ) : null}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Cari Material</label>
            <SmartSearch value={materialQuery} onChange={setMaterialQuery} placeholder="Cari data..." />
            {!selectedTicketId ? <p className="mt-2 text-sm text-gray-600">Pilih ticket terlebih dahulu sebelum membuat draft material.</p> : null}
            {selectedTicketId && !selectedTicketIsAssignable ? <p className="mt-2 text-sm text-danger">Ticket sudah ditugaskan dan tidak bisa didraft ulang.</p> : null}
          </div>

          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-600">
                <th className="px-3 py-2">Nama Material</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Stok Tersedia</th>
                <th className="px-3 py-2">Satuan</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.length > 0 ? (
                filteredMaterials.map((item) => (
                  <tr key={item.id} className={`border-b border-gray-100 ${item.id === selectedMaterial?.id ? "bg-sky-50" : ""}`}>
                    <td className="px-3 py-2">{item.name}</td>
                    <td className="px-3 py-2 font-mono">{item.sku}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2">{item.unit}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-4 text-center text-gray-500" colSpan={4}>Data tidak ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Preview Material Request">
        <Table
          data={draftRows}
          emptyText="Belum ada draft material."
          columns={[
            { header: "Material", key: "material", render: (row) => row.material },
            { header: "Teknisi", key: "technician", render: (row) => row.technician },
            { header: "Qty", key: "quantity", render: (row) => row.quantity },
            {
              header: "Aksi",
              key: "action",
              render: (row) => (
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => onEditDraft(row.id)}>
                    Edit
                  </Button>
                  <Button type="button" variant="danger" onClick={() => onDeleteDraft(row.id)}>
                    Hapus
                  </Button>
                </div>
              )
            }
          ]}
        />
      </Card>

      <Card>
        <Button onClick={onSubmitAssignment} disabled={!selectedTicketId || !selectedTicketIsAssignable || selectedTechnicians.length === 0 || materialsDraft.length === 0 || isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Submit Assignment"}
        </Button>
        {submitMessage ? <p className="mt-2 text-sm text-gray-700">{submitMessage}</p> : null}
      </Card>
    </div>
  );
}
