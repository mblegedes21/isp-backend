<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketMaterialRequest;
use App\Models\User;
use App\Services\ApiActorResolver;
use App\Services\AuditLogger;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\QueryException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Throwable;

class TicketMaterialRequestController extends Controller
{
    public function storeDirect(Request $request, ApiActorResolver $actorResolver, AuditLogger $auditLogger): JsonResponse
    {
        try {
            $actor = $actorResolver->resolve($request);
            $actorResolver->ensureRole($actor, ['TEKNISI']);

            $validator = Validator::make($request->all(), [
                'ticket_id' => ['required'],
                'material_id' => ['required', 'exists:materials,id'],
                'quantity' => ['required', 'numeric', 'min:1'],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi request gagal',
                    'errors' => $validator->errors(),
                    'data' => [],
                ], 422);
            }

            $data = $validator->validated();
            $ticket = $this->resolveTicketWithTechnicians((string) $data['ticket_id']);

            if (!$this->ticketHasTechnician($ticket, (int) $actor->id)) {
                throw new AuthorizationException('Tiket ini bukan milik teknisi aktif.');
            }

            Log::info('ticket.material_request.insert', [
                'ticket_id' => $ticket->id,
                'material_id' => (int) $data['material_id'],
                'technician_id' => $actor->id,
                'quantity' => (int) $data['quantity'],
            ]);

            $created = DB::transaction(function () use ($ticket, $data, $actor) {
                return TicketMaterialRequest::query()->create([
                    'ticket_id' => $ticket->id,
                    'teknisi_id' => $actor->id,
                    'technician_id' => $actor->id,
                    'material_id' => (int) $data['material_id'],
                    'quantity' => (int) $data['quantity'],
                    'requested_by' => $actor->id,
                    'requested_role' => User::ROLE_TEKNISI,
                    'status' => TicketMaterialRequest::STATUS_PENDING,
                ]);
            });

            Log::info('ticket.material_request.saved', [
                'request_id' => $created->id,
                'ticket_id' => $ticket->id,
                'material_id' => $created->material_id,
                'technician_id' => $created->technician_id,
                'quantity' => $created->quantity,
            ]);

            $auditLogger->write(
                action: 'ticket.materials.requested',
                module: 'warehouse',
                entityType: TicketMaterialRequest::class,
                entityId: $created->id,
                afterState: $created->toArray(),
                userId: $actor->id,
                branchId: $ticket->branch_id,
                areaId: $ticket->area_id,
                request: $request,
            );

            $created->load(['material:id,name,brand,unit', 'requester:id,name', 'technician:id,name', 'ticket:id,nomor_ticket']);

            return response()->json([
                'success' => true,
                'message' => 'Permintaan material berhasil disimpan.',
                'data' => $this->serializeRequest($created),
            ], 201);
        } catch (AuthorizationException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
                'data' => [],
            ], 403);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Tiket tidak ditemukan.',
                'data' => [],
            ], 404);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
                'data' => [],
            ], 500);
        }
    }

    public function store(Request $request, ApiActorResolver $actorResolver, AuditLogger $auditLogger, string $ticketId): JsonResponse
    {
        try {
            $actor = $actorResolver->resolve($request);
            $actorResolver->ensureRole($actor, ['TEKNISI']);
            $ticket = $this->resolveTicketWithTechnicians($ticketId);
            $payload = [
                'materials' => collect((array) $request->input('materials', []))
                    ->map(function ($material) use ($actor) {
                        $row = (array) $material;

                        return [
                            'material_id' => $row['material_id'] ?? null,
                            'teknisi_id' => $row['teknisi_id'] ?? $row['technician_id'] ?? ($actor->isTechnician() ? $actor->id : null),
                            'quantity' => $this->resolveRequestedQuantity($row),
                        ];
                    })
                    ->values()
                    ->all(),
            ];

            $validator = Validator::make($payload, [
                'materials' => ['required', 'array', 'min:1'],
                'materials.*.material_id' => ['required', 'exists:materials,id'],
                'materials.*.teknisi_id' => ['required', 'integer', 'exists:users,id'],
                'materials.*.quantity' => ['required', 'numeric', 'min:1'],
            ]);

            $validator->after(function ($validator) use ($payload, $actor, $ticket) {
                foreach ((array) ($payload['materials'] ?? []) as $index => $material) {
                    $technicianId = (int) ($material['teknisi_id'] ?? 0);

                    if ($technicianId <= 0) {
                        $validator->errors()->add(
                            "materials.{$index}.teknisi_id",
                            'Teknisi tujuan wajib dipilih untuk setiap material.'
                        );
                    }

                    if ($technicianId > 0 && !$this->ticketHasTechnician($ticket, $technicianId)) {
                        $validator->errors()->add(
                            "materials.{$index}.teknisi_id",
                            'Teknisi tujuan tidak terdaftar pada tiket ini.'
                        );
                    }
                }
            });

            $data = $validator->validate();

            if ($actor->isTechnician()) {
                $assignedTechnicianIds = collect($ticket->technicians ?? [])
                    ->pluck('id')
                    ->push($ticket->technician_id)
                    ->filter()
                    ->map(fn ($id) => (int) $id);
                if (!$assignedTechnicianIds->contains((int) $actor->id)) {
                    throw new AuthorizationException('Tiket ini bukan milik teknisi aktif.');
                }
            }

            $created = DB::transaction(function () use ($data, $ticket, $actor) {
                return collect($data['materials'])->map(function (array $material) use ($ticket, $actor) {
                    $technicianId = (int) ($material['teknisi_id'] ?? 0);

                    return TicketMaterialRequest::query()->create([
                        'ticket_id' => $ticket->id,
                        'teknisi_id' => $technicianId,
                        'technician_id' => $technicianId,
                        'material_id' => (int) $material['material_id'],
                        'quantity' => (int) $material['quantity'],
                        'requested_by' => $actor->id,
                        'requested_role' => User::ROLE_TEKNISI,
                        'status' => TicketMaterialRequest::STATUS_PENDING,
                    ]);
                });
            });

            $auditLogger->write(
                action: 'ticket.materials.requested',
                module: 'warehouse',
                entityType: Ticket::class,
                entityId: $ticket->id,
                afterState: ['requests' => $created->map->toArray()->values()],
                userId: $actor->id,
                branchId: $ticket->branch_id,
                areaId: $ticket->area_id,
                request: $request,
            );

            return response()->json([
                'success' => true,
                'message' => 'Material requests created',
                'data' => $created
                    ->load(['material:id,name,brand,unit', 'requester:id,name', 'technician:id,name'])
                    ->map(fn (TicketMaterialRequest $ticketMaterialRequest) => $this->serializeRequest($ticketMaterialRequest))
                    ->values(),
            ], 201);
        } catch (QueryException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => [
                    'materials' => ['Schema ticket material request belum sinkron. Jalankan migrate agar kolom teknisi_id tersedia.'],
                ],
                'data' => [],
            ], 422);
        } catch (ValidationException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi permintaan material gagal.',
                'errors' => $exception->errors(),
                'data' => [],
            ], 422);
        } catch (AuthorizationException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
                'data' => [],
            ], 403);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Tiket tidak ditemukan.',
                'data' => [],
            ], 404);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
                'data' => [],
            ], 500);
        }
    }

    public function show(string $ticketId): JsonResponse
    {
        try {
            $ticket = $this->resolveTicketWithTechnicians($ticketId);
            $actor = request()->user();

            $rows = TicketMaterialRequest::query()
                ->with(['material:id,name,brand,unit', 'requester:id,name', 'technician:id,name'])
                ->where('ticket_id', $ticket->id)
                ->when($actor?->isTechnician(), function ($query) use ($actor) {
                    $query->where(function ($scopedQuery) use ($actor) {
                        $scopedQuery->where('teknisi_id', $actor->id)
                            ->orWhere('technician_id', $actor->id);
                    });
                })
                ->get();

            Log::info('ticket.material_request.show', [
                'ticket_id' => $ticket->id,
                'teknisi_id' => $actor?->id,
                'rows' => $rows->count(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Material requests loaded.',
                'data' => $rows->map(fn (TicketMaterialRequest $request) => $this->serializeRequest($request))->values(),
            ]);
        } catch (QueryException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => [
                    'materials' => ['Schema ticket material request belum sinkron. Jalankan migrate agar kolom teknisi_id tersedia.'],
                ],
                'data' => [],
            ], 422);
        } catch (Throwable $exception) {
            Log::error('ticket.material_request.show.failed', [
                'ticket_id' => $ticketId,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
                'data' => [],
            ], method_exists($exception, 'getStatusCode') ? $exception->getStatusCode() : 500);
        }
    }

    public function ticketMaterials(string $ticketId): JsonResponse
    {
        return $this->show($ticketId);
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'ticket_id' => ['nullable'],
                'status' => ['nullable', 'string', 'max:40'],
            ]);

            $query = TicketMaterialRequest::query()
                ->with(array_filter([
                    'ticket:id,nomor_ticket,leader_id,technician_id',
                    'ticket.leader:id,name',
                    'ticket.technician:id,name',
                    $this->canLoadTicketTechniciansPivot() ? 'ticket.technicians:id,name' : null,
                    'material:id,name,brand,unit',
                    'requester:id,name',
                    'technician:id,name',
                ]))
                ->latest();
            $actor = $request->user();

            if ($request->filled('ticket_id')) {
                $ticketId = $request->string('ticket_id');
                $query->whereHas('ticket', function ($ticketQuery) use ($ticketId) {
                    $ticketQuery->where('id', $ticketId)->orWhere('nomor_ticket', $ticketId);
                });
            }

            if ($request->filled('status')) {
                $query->where('status', $request->string('status'));
            }

            if ($actor?->isTechnician()) {
                $query->where(function ($scopedQuery) use ($actor) {
                    $scopedQuery->where('teknisi_id', $actor->id)
                        ->orWhere('technician_id', $actor->id);
                });
            }

            $rows = $query->get();
            Log::info('ticket.material_request.index', [
                'ticket_id' => $request->input('ticket_id'),
                'teknisi_id' => $actor?->id,
                'rows' => $rows->count(),
            ]);

            if ($actor?->isTechnician()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Permintaan material tiket berhasil dimuat.',
                    'data' => $rows->map(fn (TicketMaterialRequest $ticketMaterialRequest) => $this->serializeRequest($ticketMaterialRequest))->values(),
                ]);
            }

            $grouped = $rows
                ->groupBy(fn (TicketMaterialRequest $item) => sprintf('%s:%s', $item->ticket_id, $item->teknisi_id ?: $item->technician_id ?: 0))
                ->map(fn (Collection $items) => $this->serializeTicketGroup($items))
                ->values();

            return response()->json([
                'success' => true,
                'message' => 'Permintaan material tiket berhasil dimuat.',
                'data' => $grouped,
            ]);
        } catch (Throwable $exception) {
            Log::error('ticket.material_request.index.failed', [
                'ticket_id' => $request->input('ticket_id'),
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
                'data' => [],
            ], method_exists($exception, 'getStatusCode') ? $exception->getStatusCode() : 500);
        }
    }

    private function serializeTicketGroup(Collection $items): array
    {
        /** @var TicketMaterialRequest $first */
        $first = $items->first();
        if (!$first) {
            return [
                'ticket_id' => '',
                'ticket_db_id' => '',
                'leader_name' => '-',
                'technicians' => [],
                'requested_materials' => [],
            ];
        }

        $ticket = $first->ticket;
        $technicians = $ticket?->technicians?->pluck('name')->filter()->values() ?? collect();

        if ($technicians->isEmpty() && $ticket?->technician?->name) {
            $technicians = collect([$ticket->technician->name]);
        }

        return [
            'ticket_id' => (string) ($ticket?->nomor_ticket ?: $ticket?->id),
            'ticket_db_id' => (string) $ticket?->id,
            'leader_name' => $ticket?->leader?->name ?? '-',
            'teknisi_id' => $first->teknisi_id ? (string) $first->teknisi_id : ($first->technician_id ? (string) $first->technician_id : null),
            'teknisi_ids' => ($first->teknisi_id || $first->technician_id) ? collect([(string) ($first->teknisi_id ?: $first->technician_id)]) : collect(),
            'teknisi_options' => $first->technician ? collect([['id' => (string) ($first->teknisi_id ?: $first->technician_id), 'name' => $first->technician->name]]) : collect(),
            'technicians' => $technicians->values(),
            'requested_materials' => $items->map(fn (TicketMaterialRequest $request) => $this->serializeRequest($request))->values(),
        ];
    }

    private function serializeRequest(TicketMaterialRequest $request): array
    {
        return [
            'id' => (string) $request->id,
            'ticket_id' => (string) ($request->ticket?->nomor_ticket ?: $request->ticket_id),
            'ticket_db_id' => (string) $request->ticket_id,
            'teknisi_id' => ($request->teknisi_id ?: $request->technician_id) ? (string) ($request->teknisi_id ?: $request->technician_id) : null,
            'technician_name' => $request->technician?->name,
            'material_id' => (string) $request->material_id,
            'material_name' => trim(collect([$request->material?->brand, $request->material?->name])->filter()->implode(' ')),
            'unit' => $request->material?->unit,
            'quantity' => (int) $request->quantity,
            'requested_by' => (string) $request->requested_by,
            'requested_by_name' => $request->requester?->name,
            'requested_role' => $request->requested_role,
            'status' => $request->status,
            'released_quantity' => (int) $request->released_quantity,
            'returned_quantity' => (int) $request->returned_quantity,
            'created_at' => $request->created_at?->toISOString(),
        ];
    }

    private function resolveTicketWithTechnicians(string $ticketId): Ticket
    {
        return Ticket::query()
            ->with(array_filter([
                $this->canLoadTicketTechniciansPivot() ? 'technicians:id,name' : null,
                'technician:id,name',
            ]))
            ->where('nomor_ticket', $ticketId)
            ->orWhere('id', $ticketId)
            ->firstOrFail();
    }

    private function resolveRequestedQuantity(array $material): ?int
    {
        $qtyRequested = $material['qty_requested'] ?? null;
        if ($qtyRequested !== null && $qtyRequested !== '') {
            return (int) $qtyRequested;
        }

        $quantity = $material['quantity'] ?? null;
        if ($quantity !== null && $quantity !== '') {
            return (int) $quantity;
        }

        $hasUsed = array_key_exists('used', $material) && $material['used'] !== null && $material['used'] !== '';
        $hasRemaining = array_key_exists('remaining', $material) && $material['remaining'] !== null && $material['remaining'] !== '';

        if ($hasUsed || $hasRemaining) {
            return (int) ($material['used'] ?? 0) + (int) ($material['remaining'] ?? 0);
        }

        return null;
    }

    private function canLoadTicketTechniciansPivot(): bool
    {
        return Schema::hasTable('ticket_technicians')
            && Schema::hasColumn('ticket_technicians', 'created_at')
            && Schema::hasColumn('ticket_technicians', 'updated_at');
    }

    private function ticketHasTechnician(Ticket $ticket, int $technicianId): bool
    {
        if ((int) $ticket->technician_id === $technicianId) {
            return true;
        }

        return collect($ticket->technicians ?? [])->pluck('id')->map(fn ($id) => (int) $id)->contains($technicianId);
    }
}
