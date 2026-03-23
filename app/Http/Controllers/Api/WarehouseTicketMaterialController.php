<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\Product;
use App\Models\StockTransaction;
use App\Models\Ticket;
use App\Models\TicketMaterialAssignment;
use App\Models\TicketMaterialRequest;
use App\Models\WarehouseTransaction;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class WarehouseTicketMaterialController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $requests = TicketMaterialRequest::query()
                ->with([
                    'ticket:id,nomor_ticket,leader_id,technician_id',
                    'ticket.leader:id,name',
                    'ticket.technician:id,name',
                    'ticket.technicians:id,name',
                    'material:id,name,brand,unit',
                    'requester:id,name',
                    'technician:id,name',
                ])
                ->where('requested_role', 'TEKNISI')
                ->whereIn('status', [
                    TicketMaterialRequest::STATUS_PENDING,
                    TicketMaterialRequest::STATUS_APPROVED,
                    TicketMaterialRequest::STATUS_RELEASED,
                    TicketMaterialRequest::STATUS_PARTIAL_RETURN,
                ])
                ->latest()
                ->get();

            $grouped = $requests
                ->groupBy(fn (TicketMaterialRequest $item) => sprintf('%s:%s', $item->ticket_id, $item->teknisi_id ?: $item->technician_id ?: 0))
                ->map(fn (Collection $items) => $this->serializeTicketRequestGroup($items))
                ->values();

            return response()->json([
                'success' => true,
                'message' => 'Daftar permintaan material teknisi berhasil dimuat.',
                'data' => $grouped,
            ]);
        } catch (\Throwable $exception) {
            Log::error('warehouse.ticket-material-requests.index.failed', [
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
                'data' => [],
            ], method_exists($exception, 'getStatusCode') ? $exception->getStatusCode() : 500);
        }
    }

    public function processRequest(string $id): JsonResponse
    {
        try {
            $materialRequest = TicketMaterialRequest::query()
                ->with(['material:id,name,brand,unit', 'technician:id,name', 'ticket:id,nomor_ticket'])
                ->findOrFail($id);

            if ($materialRequest->requested_role !== 'TEKNISI') {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya permintaan material tambahan teknisi yang dapat diproses.',
                    'data' => null,
                ], 422);
            }

            if ($materialRequest->status === TicketMaterialRequest::STATUS_PENDING) {
                $materialRequest->update([
                    'status' => TicketMaterialRequest::STATUS_APPROVED,
                ]);
            }

            Log::info('warehouse.material_request.processed', [
                'request_id' => $materialRequest->id,
                'ticket_id' => $materialRequest->ticket_id,
                'teknisi_id' => $materialRequest->teknisi_id ?: $materialRequest->technician_id,
                'status' => $materialRequest->status,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Request processed',
                'data' => $this->serializeRequestRow($materialRequest->fresh(['material:id,name,brand,unit', 'technician:id,name', 'ticket:id,nomor_ticket'])),
            ]);
        } catch (\Throwable $exception) {
            Log::error('warehouse.material_request.process.failed', [
                'request_id' => $id,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
                'data' => null,
            ], method_exists($exception, 'getStatusCode') ? $exception->getStatusCode() : 500);
        }
    }

    public function releaseMaterials(Request $request, Ticket $ticket, AuditLogger $auditLogger): JsonResponse
    {
        try {
            Log::info('warehouse.release_materials.request', $request->all());
            $data = $this->validateReleasePayload($request, $ticket);

            $createdTransactions = DB::transaction(function () use ($data, $request, $ticket) {
                return collect($data['materials'])->map(function (array $row) use ($data, $request, $ticket) {
                    $technicianId = isset($data['technician_id']) && $data['technician_id'] !== null
                        ? (int) $data['technician_id']
                        : null;
                    $materialRequest = $this->resolveMaterialRequest($ticket, $row, $technicianId);
                    $material = Material::query()->lockForUpdate()->findOrFail($materialRequest->material_id);
                    $quantity = (int) $row['quantity'];

                    abort_if($materialRequest->status === TicketMaterialRequest::STATUS_RETURNED, 422, 'Request material ini sudah selesai.');
                    abort_if($quantity <= 0, 422, 'Jumlah release tidak valid.');
                    abort_if((int) $material->stock < $quantity, 422, 'Stok material tidak mencukupi.');

                    $material->update([
                        'stock' => (int) $material->stock - $quantity,
                    ]);

                    Product::query()->whereKey($material->id)->update([
                        'stok' => $material->stock,
                        'branch_id' => $material->branch_id,
                    ]);

                    $warehouseTransaction = WarehouseTransaction::query()->create([
                        'material_id' => $material->id,
                        'transaction_type' => WarehouseTransaction::TYPE_TECHNICIAN_OUT,
                        'quantity' => $quantity,
                        'unit_price' => (float) ($material->purchase_price ?? 0),
                        'total_price' => (float) ($material->purchase_price ?? 0) * $quantity,
                        'technician_id' => $materialRequest->technician_id ?: $technicianId ?: $ticket->technician_id,
                        'ticket_id' => $ticket->id,
                        'status' => 'RELEASED',
                        'notes' => 'Material release untuk ticket '.$ticket->nomor_ticket,
                        'created_by' => $request->user()?->id,
                    ]);

                    StockTransaction::query()->create([
                        'material_id' => $material->id,
                        'branch_id' => $material->branch_id,
                        'ticket_id' => $ticket->id,
                        'user_id' => $request->user()?->id,
                        'created_by' => $request->user()?->id,
                        'transaction_type' => 'OUT',
                        'type' => 'OUT',
                        'quantity' => $quantity,
                        'unit_price' => (float) ($material->purchase_price ?? 0),
                        'total_price' => (float) ($material->purchase_price ?? 0) * $quantity,
                        'reference_type' => WarehouseTransaction::class,
                        'reference_id' => (string) $warehouseTransaction->id,
                        'notes' => 'Material release untuk ticket '.$ticket->nomor_ticket,
                    ]);

                    $materialRequest->update([
                        'status' => TicketMaterialRequest::STATUS_RELEASED,
                        'released_by' => $request->user()?->id,
                        'released_quantity' => (int) $materialRequest->released_quantity + $quantity,
                    ]);

                    $assignment = TicketMaterialAssignment::query()->firstOrNew(
                        [
                            'ticket_id' => $ticket->id,
                            'technician_id' => $materialRequest->technician_id ?: $technicianId ?: $ticket->technician_id,
                            'material_id' => $material->id,
                        ]
                    );
                    $assignment->ticket_material_request_id = $materialRequest->id;
                    $assignment->quantity_assigned = (int) ($assignment->quantity_assigned ?? 0) + $quantity;
                    $assignment->save();

                    return $warehouseTransaction->load(['material', 'ticket']);
                });
            });

            $auditLogger->write(
                action: 'warehouse.ticket-material.released',
                module: 'warehouse',
                entityType: Ticket::class,
                entityId: $ticket->id,
                afterState: ['transactions' => $createdTransactions->map->toArray()->values()],
                userId: $request->user()?->id,
                branchId: $ticket->branch_id,
                areaId: $ticket->area_id,
                request: $request,
            );

            return response()->json([
                'success' => true,
                'message' => 'Pengeluaran berhasil',
                'data' => $this->buildReleaseReport($ticket->fresh(['leader:id,name', 'technician:id,name', 'technicians:id,name'])),
            ]);
        } catch (ValidationException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $exception->errors(),
                'data' => null,
            ], 422);
        } catch (\Throwable $exception) {
            Log::error('warehouse.release-materials.failed', [
                'ticket_id' => $ticket->id,
                'payload' => $request->all(),
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menyimpan pengeluaran material.',
                'errors' => [
                    'server' => [$exception->getMessage()],
                ],
                'data' => null,
            ], 500);
        }
    }

    public function releaseReport(Ticket $ticket): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Laporan pengeluaran material berhasil dimuat.',
            'data' => $this->buildReleaseReport($ticket->load(['leader:id,name', 'technician:id,name', 'technicians:id,name'])),
        ]);
    }

    public function returnChecklist(Ticket $ticket): JsonResponse
    {
        $requests = TicketMaterialRequest::query()
            ->with(['material:id,name,brand,unit'])
            ->where('ticket_id', $ticket->id)
            ->where('released_quantity', '>', 0)
            ->get();

        $rows = $requests->map(function (TicketMaterialRequest $request) {
            $remaining = max(0, (int) $request->released_quantity - (int) $request->returned_quantity);

            return [
                'request_id' => (string) $request->id,
                'material_id' => (string) $request->material_id,
                'material_name' => trim(collect([$request->material?->brand, $request->material?->name])->filter()->implode(' ')),
                'unit' => $request->material?->unit,
                'quantity_released' => (int) $request->released_quantity,
                'quantity_returned' => (int) $request->returned_quantity,
                'remaining_quantity' => $remaining,
                'status' => (int) $request->returned_quantity > 0 ? 'Returned' : 'Used',
            ];
        })->values();

        return response()->json([
            'success' => true,
            'message' => 'Checklist pengembalian material berhasil dimuat.',
            'data' => [
                'ticket_id' => (string) ($ticket->nomor_ticket ?: $ticket->id),
                'rows' => $rows,
            ],
        ]);
    }

    public function processReturns(Request $request, Ticket $ticket, AuditLogger $auditLogger): JsonResponse
    {
        $data = $request->validate([
            'returns' => ['required', 'array', 'min:1'],
            'returns.*.request_id' => ['required', 'exists:ticket_material_requests,id'],
            'returns.*.quantity_returned' => ['required', 'integer', 'min:0'],
        ]);

        $returnTransactions = DB::transaction(function () use ($data, $request, $ticket) {
            return collect($data['returns'])->map(function (array $row) use ($request, $ticket) {
                $materialRequest = TicketMaterialRequest::query()
                    ->where('ticket_id', $ticket->id)
                    ->lockForUpdate()
                    ->findOrFail($row['request_id']);

                $remaining = max(0, (int) $materialRequest->released_quantity - (int) $materialRequest->returned_quantity);
                abort_if((int) $row['quantity_returned'] > $remaining, 422, 'Jumlah pengembalian melebihi material yang dikeluarkan.');

                if ((int) $row['quantity_returned'] === 0) {
                    return null;
                }

                $material = Material::query()->lockForUpdate()->findOrFail($materialRequest->material_id);
                $material->update([
                    'stock' => (int) $material->stock + (int) $row['quantity_returned'],
                ]);

                Product::query()->whereKey($material->id)->update([
                    'stok' => $material->stock,
                    'branch_id' => $material->branch_id,
                ]);

                $warehouseTransaction = WarehouseTransaction::query()->create([
                    'material_id' => $material->id,
                    'transaction_type' => WarehouseTransaction::TYPE_TECHNICIAN_RETURN,
                    'quantity' => $row['quantity_returned'],
                    'unit_price' => (float) ($material->purchase_price ?? 0),
                    'total_price' => (float) ($material->purchase_price ?? 0) * (int) $row['quantity_returned'],
                    'technician_id' => $materialRequest->technician_id ?: $materialRequest->ticket?->technician_id,
                    'ticket_id' => $ticket->id,
                    'status' => 'RETURNED',
                    'notes' => 'Pengembalian material untuk ticket '.$ticket->nomor_ticket,
                    'created_by' => $request->user()?->id,
                ]);

                StockTransaction::query()->create([
                    'material_id' => $material->id,
                    'branch_id' => $material->branch_id,
                    'ticket_id' => $ticket->id,
                    'user_id' => $request->user()?->id,
                    'created_by' => $request->user()?->id,
                    'transaction_type' => 'RETURN',
                    'type' => 'RETURN',
                    'quantity' => $row['quantity_returned'],
                    'unit_price' => (float) ($material->purchase_price ?? 0),
                    'total_price' => (float) ($material->purchase_price ?? 0) * (int) $row['quantity_returned'],
                    'reference_type' => WarehouseTransaction::class,
                    'reference_id' => (string) $warehouseTransaction->id,
                    'notes' => 'Pengembalian material untuk ticket '.$ticket->nomor_ticket,
                ]);

                $newReturned = (int) $materialRequest->returned_quantity + (int) $row['quantity_returned'];
                $materialRequest->update([
                    'returned_quantity' => $newReturned,
                    'return_verified_by' => $request->user()?->id,
                    'status' => $newReturned >= (int) $materialRequest->released_quantity
                        ? TicketMaterialRequest::STATUS_RETURNED
                        : TicketMaterialRequest::STATUS_PARTIAL_RETURN,
                ]);

                $assignment = TicketMaterialAssignment::query()
                    ->where('ticket_id', $ticket->id)
                    ->where('technician_id', $materialRequest->technician_id ?: $materialRequest->ticket?->technician_id)
                    ->where('material_id', $materialRequest->material_id)
                    ->first();

                if ($assignment) {
                    $assignment->quantity_returned = min(
                        (int) $assignment->quantity_assigned,
                        (int) ($assignment->quantity_returned ?? 0) + (int) $row['quantity_returned']
                    );
                    $assignment->save();
                }

                return $warehouseTransaction;
            })->filter()->values();
        });

        $auditLogger->write(
            action: 'warehouse.ticket-material.returned',
            module: 'warehouse',
            entityType: Ticket::class,
            entityId: $ticket->id,
            afterState: ['transactions' => $returnTransactions->map->toArray()->values()],
            userId: $request->user()?->id,
            branchId: $ticket->branch_id,
            areaId: $ticket->area_id,
            request: $request,
        );

        return response()->json([
            'success' => true,
            'message' => 'Pengembalian material berhasil diverifikasi.',
            'data' => $this->returnChecklist($ticket)->getData(true)['data'],
        ]);
    }

    private function serializeTicketRequestGroup(Collection $items): array
    {
        /** @var TicketMaterialRequest $first */
        $first = $items->first();
        $ticket = $first->ticket;
        $targetTechnician = $items->first()?->technician;
        $technicians = collect([$targetTechnician?->name ?? $ticket?->technician?->name])->filter()->values();

        $technicianOptions = $ticket?->technicians?->map(fn ($technician) => [
            'id' => (string) $technician->id,
            'name' => $technician->name,
        ])->values() ?? collect();

        if ($technicianOptions->isEmpty() && $ticket?->technician?->id) {
            $technicianOptions = collect([[
                'id' => (string) $ticket->technician->id,
                'name' => $ticket->technician->name,
            ]]);
        }

        return [
            'ticket_id' => (string) ($ticket?->nomor_ticket ?: $ticket?->id),
            'ticket_db_id' => (string) $ticket?->id,
            'leader_name' => $ticket?->leader?->name ?? '-',
            'teknisi_id' => ($items->first()?->teknisi_id ?: $items->first()?->technician_id) ? (string) ($items->first()?->teknisi_id ?: $items->first()?->technician_id) : null,
            'technician_ids' => $technicianOptions->pluck('id')->values(),
            'technician_options' => $technicianOptions,
            'technicians' => $technicians->values(),
            'requested_materials' => $items->map(fn (TicketMaterialRequest $request) => $this->serializeRequestRow($request))->values(),
        ];
    }

    private function serializeRequestRow(TicketMaterialRequest $request): array
    {
        return [
            'id' => (string) $request->id,
            'teknisi_id' => ($request->teknisi_id ?: $request->technician_id) ? (string) ($request->teknisi_id ?: $request->technician_id) : null,
            'technician_name' => $request->technician?->name,
            'material_id' => (string) $request->material_id,
            'material_name' => trim(collect([$request->material?->brand, $request->material?->name])->filter()->implode(' ')),
            'unit' => $request->material?->unit,
            'quantity' => (int) $request->quantity,
            'requested_by_name' => $request->requester?->name ?? '-',
            'requested_role' => $request->requested_role,
            'status' => $request->status,
            'released_quantity' => (int) $request->released_quantity,
            'returned_quantity' => (int) $request->returned_quantity,
            'ticket_id' => (string) ($request->ticket?->nomor_ticket ?: $request->ticket_id),
        ];
    }

    private function buildReleaseReport(Ticket $ticket): array
    {
        $released = WarehouseTransaction::query()
            ->with(['material:id,name,brand,unit'])
            ->where('ticket_id', $ticket->id)
            ->where('transaction_type', WarehouseTransaction::TYPE_TECHNICIAN_OUT)
            ->get()
            ->groupBy('material_id')
            ->map(function (Collection $transactions) {
                /** @var WarehouseTransaction $first */
                $first = $transactions->first();

                return [
                    'material_name' => trim(collect([$first->material?->brand, $first->material?->name])->filter()->implode(' ')),
                    'unit' => $first->material?->unit,
                    'quantity' => $transactions->sum('quantity'),
                ];
            })
            ->values();

        $technicians = $ticket->technicians->pluck('name')->filter();
        if ($technicians->isEmpty() && $ticket->technician?->name) {
            $technicians = collect([$ticket->technician->name]);
        }

        return [
            'ticket_id' => (string) ($ticket->nomor_ticket ?: $ticket->id),
            'leader_name' => $ticket->leader?->name ?? '-',
            'technicians' => $technicians->values(),
            'materials' => $released,
        ];
    }

    private function validateReleasePayload(Request $request, Ticket $ticket): array
    {
        $validator = Validator::make($request->all(), [
            'ticket_id' => ['required', 'integer', 'exists:tickets,id'],
            'technician_id' => ['nullable', 'integer', 'exists:users,id'],
            'materials' => ['required', 'array', 'min:1'],
            'materials.*.material_id' => ['required', 'integer', 'exists:materials,id'],
            'materials.*.quantity' => ['required', 'numeric', 'min:1'],
            'materials.*.request_id' => ['nullable', 'integer', 'exists:ticket_material_requests,id'],
        ], [
            'ticket_id.required' => 'Ticket wajib dipilih.',
            'ticket_id.integer' => 'Ticket tidak valid.',
            'ticket_id.exists' => 'Ticket tidak ditemukan.',
            'technician_id.integer' => 'Teknisi tidak valid.',
            'technician_id.exists' => 'Teknisi tidak ditemukan.',
            'materials.required' => 'Minimal satu material wajib dipilih.',
            'materials.array' => 'Format material tidak valid.',
            'materials.min' => 'Minimal satu material wajib dipilih.',
            'materials.*.material_id.required' => 'Material wajib dipilih.',
            'materials.*.material_id.integer' => 'Material tidak valid.',
            'materials.*.material_id.exists' => 'Material tidak ditemukan.',
            'materials.*.quantity.required' => 'Quantity material wajib diisi.',
            'materials.*.quantity.numeric' => 'Quantity material harus berupa angka.',
            'materials.*.quantity.min' => 'Quantity material minimal 1.',
            'materials.*.request_id.integer' => 'Request material tidak valid.',
            'materials.*.request_id.exists' => 'Request material tidak ditemukan.',
        ]);

        $validator->after(function ($validator) use ($request, $ticket) {
            $ticketId = (int) $request->input('ticket_id');
            $technicianId = $request->filled('technician_id') ? (int) $request->input('technician_id') : null;
            $assignedTechnicianIds = $ticket->technicians()->pluck('users.id')->map(fn ($id) => (int) $id)->all();

            if ((int) $ticket->id !== $ticketId) {
                $validator->errors()->add('ticket_id', 'Ticket pada payload tidak sesuai dengan route.');
            }

            if ($technicianId === null || $technicianId <= 0) {
                return;
            }

            if ((int) $ticket->technician_id === $technicianId) {
                return;
            }

            if (in_array($technicianId, $assignedTechnicianIds, true)) {
                return;
            }

            $validator->errors()->add('technician_id', 'Teknisi tidak terdaftar pada tiket ini.');
        });

        return $validator->validate();
    }

    private function resolveMaterialRequest(Ticket $ticket, array $row, ?int $technicianId): TicketMaterialRequest
    {
        $query = TicketMaterialRequest::query()
            ->where('ticket_id', $ticket->id)
            ->where('requested_role', 'TEKNISI')
            ->lockForUpdate();

        if (!empty($row['request_id'])) {
            $materialRequest = (clone $query)->find($row['request_id']);

            if (! $materialRequest) {
                throw ValidationException::withMessages([
                    'materials' => ['Request material tidak ditemukan untuk tiket ini.'],
                ]);
            }

            if ((int) $materialRequest->material_id !== (int) $row['material_id']) {
                throw ValidationException::withMessages([
                    'materials' => ['Material request tidak cocok dengan material yang dikirim.'],
                ]);
            }

            $requestTechnicianId = (int) ($materialRequest->teknisi_id ?: $materialRequest->technician_id ?: 0);

            if ($technicianId && $requestTechnicianId && $requestTechnicianId !== $technicianId) {
                throw ValidationException::withMessages([
                    'materials' => ['Material request ini milik teknisi lain.'],
                ]);
            }

            return $materialRequest;
        }

        $matches = (clone $query)
            ->where('material_id', $row['material_id'])
            ->when($technicianId && $technicianId > 0, function ($builder) use ($technicianId) {
                $builder->where(function ($technicianQuery) use ($technicianId) {
                    $technicianQuery->where('teknisi_id', $technicianId)
                        ->orWhere('technician_id', $technicianId);
                });
            })
            ->whereIn('status', [
                TicketMaterialRequest::STATUS_PENDING,
                TicketMaterialRequest::STATUS_APPROVED,
                TicketMaterialRequest::STATUS_RELEASED,
                TicketMaterialRequest::STATUS_PARTIAL_RETURN,
            ])
            ->get();

        if ($matches->isEmpty()) {
            throw ValidationException::withMessages([
                'materials' => ['Material request tidak ditemukan untuk tiket ini.'],
            ]);
        }

        if ($matches->count() > 1) {
            throw ValidationException::withMessages([
                'materials' => ['Terdapat lebih dari satu request untuk material ini. Kirim request_id agar release dapat diproses dengan aman.'],
            ]);
        }

        return $matches->first();
    }
}
