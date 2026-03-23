<?php

namespace App\Http\Controllers\Api;

use App\Events\TicketEscalated;
use App\Http\Controllers\Controller;
use App\Jobs\DetectIncidentForArea;
use App\Jobs\RecalculateManagerStatistics;
use App\Models\Escalation;
use App\Models\Ticket;
use App\Services\ApiActorResolver;
use App\Services\AuditLogger;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class EscalationController extends Controller
{
    public function list(Request $request, ApiActorResolver $actorResolver): JsonResponse
    {
        if ($response = $this->guardSchema()) {
            return $response;
        }

        try {
            $actor = $actorResolver->resolve($request);
            $actorResolver->ensureRole($actor, ['NOC', 'LEADER', 'MANAGER']);

            $data = $request->validate([
                'status' => ['nullable', Rule::in(Escalation::STATUSES)],
                'severity' => ['nullable', Rule::in(Escalation::SEVERITIES)],
                'type' => ['nullable', Rule::in(Escalation::TYPES)],
            ]);

            $query = Escalation::query()
                ->with(['ticket', 'creator'])
                ->latest();

            if (!$actor->isManager()) {
                if (Schema::hasColumn('escalations', 'created_by')) {
                    $query->where('created_by', $actor->id);
                } else {
                    $query->where('escalated_by', $actor->id);
                }
            }

            if (!empty($data['status']) && Schema::hasColumn('escalations', 'status')) {
                $query->where('status', $data['status']);
            }

            if (!empty($data['severity']) && Schema::hasColumn('escalations', 'severity')) {
                $query->where('severity', $data['severity']);
            }

            if (!empty($data['type']) && Schema::hasColumn('escalations', 'type')) {
                $query->where('type', $data['type']);
            }

            $escalations = $query->get();

            return response()->json([
                'success' => true,
                'message' => 'Daftar eskalasi berhasil dimuat.',
                'data' => $escalations->map(function (Escalation $escalation) {
                    return [
                        'id' => $escalation->id,
                        'ticket_code' => $escalation->ticket?->code ?? $escalation->ticket?->nomor_ticket ?? null,
                        'ticket_id' => (string) ($escalation->ticket?->nomor_ticket ?: $escalation->ticket_id),
                        'role' => $escalation->role ?? null,
                        'type' => $escalation->type ?? $escalation->reason,
                        'description' => $escalation->description ?? $escalation->note,
                        'status' => $escalation->status ?? 'pending',
                        'severity' => $escalation->severity ?? null,
                        'impact' => $escalation->impact ?? null,
                        'requires_immediate_action' => (bool) ($escalation->requires_immediate_action ?? false),
                        'created_by' => $escalation->created_by ?? $escalation->escalated_by,
                        'created_by_name' => $escalation->creator?->name,
                        'created_at' => $escalation->created_at,
                    ];
                })->values(),
            ]);
        } catch (ValidationException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi filter escalation gagal.',
                'errors' => $exception->errors(),
                'data' => [],
            ], 422);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
                'data' => [],
            ], 500);
        }
    }

    public function index(Request $request, ApiActorResolver $actorResolver, string $ticketId): JsonResponse
    {
        if ($response = $this->guardSchema()) {
            return $response;
        }

        $actor = $actorResolver->resolve($request);
        $actorResolver->ensureRole($actor, ['NOC', 'LEADER', 'MANAGER']);
        $ticket = $this->resolveTicket($ticketId);

        $rows = $ticket->escalations()
            ->with(['creator:id,name', 'handler:id,name'])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Riwayat eskalasi tiket berhasil dimuat.',
            'data' => $rows->map(fn (Escalation $escalation) => $this->serializeEscalation($escalation))->values(),
        ]);
    }

    public function store(Request $request, ApiActorResolver $actorResolver, AuditLogger $auditLogger, string $ticketId): JsonResponse
    {
        if ($response = $this->guardStoreSchema()) {
            return $response;
        }

        try {
            $actor = $actorResolver->resolve($request);
            $actorResolver->ensureRole($actor, ['NOC', 'LEADER']);
            $ticket = $this->resolveTicket($ticketId);

            $data = $request->validate([
                'type' => ['required', Rule::in(Escalation::TYPES)],
                'severity' => ['required', Rule::in(Escalation::SEVERITIES)],
                'impact' => ['nullable', Rule::in(Escalation::IMPACTS)],
                'requires_immediate_action' => ['nullable', 'boolean'],
                'description' => ['required', 'string', 'min:10'],
            ]);

            $escalation = DB::transaction(function () use ($ticket, $actor, $data) {
                $payload = [
                    'ticket_id' => $ticket->id,
                    'type' => $data['type'],
                    'severity' => $data['severity'],
                    'impact' => $data['impact'] ?? null,
                    'requires_immediate_action' => (bool) ($data['requires_immediate_action'] ?? false),
                    'description' => $data['description'],
                    'status' => 'pending',
                    'branch_id' => $ticket->branch_id,
                    'area_id' => $ticket->area_id,
                    'reason' => $data['type'],
                    'note' => $data['description'],
                    'escalated_by' => $actor->id,
                ];

                if (Schema::hasColumn('escalations', 'created_by')) {
                    $payload['created_by'] = $actor->id;
                }

                if (Schema::hasColumn('escalations', 'role')) {
                    $payload['role'] = $actor->role;
                }

                if (Schema::hasColumn('escalations', 'ticket_status_before')) {
                    $payload['ticket_status_before'] = $ticket->status;
                }

                $escalation = Escalation::query()->create($payload);

                $ticket->update([
                    'status' => 'ESCALATED',
                    'escalated_at' => now(),
                    'priority' => $this->elevatedPriority($ticket->priority, $data['severity']),
                ]);

                return $escalation;
            });

            $auditLogger->write(
                action: 'ticket.escalation.created',
                module: 'tickets',
                entityType: Ticket::class,
                entityId: $ticket->id,
                afterState: [
                    'escalation_id' => $escalation->id,
                    'type' => $escalation->type,
                    'severity' => $escalation->severity,
                    'status' => $escalation->status,
                ],
                userId: $actor->id,
                branchId: $ticket->branch_id,
                areaId: $ticket->area_id,
                request: $request,
            );

            TicketEscalated::dispatch($ticket->fresh(), $escalation->fresh());
            DetectIncidentForArea::dispatch($ticket->branch_id, $ticket->area_id);
            RecalculateManagerStatistics::dispatch();

            return response()->json([
                'success' => true,
                'message' => 'Eskalasi berhasil dibuat dan menunggu keputusan manager.',
                'data' => $this->serializeEscalation($escalation->fresh(['ticket:id,nomor_ticket,title,status,priority', 'creator:id,name', 'handler:id,name'])),
            ], 201);
        } catch (ValidationException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi eskalasi gagal.',
                'errors' => $exception->errors(),
                'data' => null,
            ], 422);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Tiket tidak ditemukan.',
                'data' => null,
            ], 404);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    public function update(Request $request, ApiActorResolver $actorResolver, AuditLogger $auditLogger, Escalation $escalation): JsonResponse
    {
        if ($response = $this->guardSchema()) {
            return $response;
        }

        try {
            $actor = $actorResolver->resolve($request);
            $actorResolver->ensureRole($actor, ['MANAGER']);

            $data = $request->validate([
                'status' => ['required', Rule::in(['approved', 'rejected', 'resolved'])],
            ]);

            $ticket = $escalation->ticket()->firstOrFail();

            DB::transaction(function () use ($escalation, $ticket, $actor, $data) {
                $escalation->update([
                    'status' => $data['status'],
                    'handled_by' => $actor->id,
                    'handled_at' => now(),
                ]);

                if (in_array($data['status'], ['rejected', 'resolved'], true)) {
                    $hasOtherOpenEscalations = $ticket->escalations()
                        ->whereKeyNot($escalation->id)
                        ->whereIn('status', Escalation::OPEN_STATUSES)
                        ->exists();

                    if (!$hasOtherOpenEscalations && $ticket->status === 'ESCALATED') {
                        $ticket->update([
                            'status' => $escalation->ticket_status_before ?: 'IN_PROGRESS',
                        ]);
                    }
                } else {
                    $ticket->update([
                        'status' => 'ESCALATED',
                        'priority' => $this->elevatedPriority($ticket->priority, $escalation->severity),
                    ]);
                }
            });

            $auditLogger->write(
                action: 'ticket.escalation.updated',
                module: 'tickets',
                entityType: Ticket::class,
                entityId: $ticket->id,
                afterState: [
                    'escalation_id' => $escalation->id,
                    'status' => $data['status'],
                ],
                userId: $actor->id,
                branchId: $ticket->branch_id,
                areaId: $ticket->area_id,
                request: $request,
            );

            RecalculateManagerStatistics::dispatch();

            return response()->json([
                'success' => true,
                'message' => 'Status eskalasi berhasil diperbarui.',
                'data' => $this->serializeEscalation($escalation->fresh(['ticket:id,nomor_ticket,title,status,priority', 'creator:id,name', 'handler:id,name'])),
            ]);
        } catch (ValidationException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi aksi eskalasi gagal.',
                'errors' => $exception->errors(),
                'data' => null,
            ], 422);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    private function serializeEscalation(Escalation $escalation): array
    {
        return [
            'id' => (string) $escalation->id,
            'ticket_id' => (string) ($escalation->ticket?->nomor_ticket ?: $escalation->ticket_id),
            'ticket_db_id' => (string) $escalation->ticket_id,
            'ticket_title' => $escalation->ticket?->title,
            'ticket_status' => $escalation->ticket?->status,
            'created_by' => (string) ($escalation->created_by ?: $escalation->escalated_by),
            'created_by_name' => $escalation->creator?->name ?: $escalation->escalator?->name,
            'role' => $escalation->role,
            'type' => $escalation->type,
            'severity' => $escalation->severity,
            'impact' => $escalation->impact,
            'requires_immediate_action' => (bool) $escalation->requires_immediate_action,
            'description' => $escalation->description ?: $escalation->note,
            'status' => $escalation->status,
            'ticket_status_before' => $escalation->ticket_status_before,
            'handled_by' => $escalation->handled_by ? (string) $escalation->handled_by : null,
            'handled_by_name' => $escalation->handler?->name,
            'handled_at' => $escalation->handled_at?->toIso8601String(),
            'created_at' => $escalation->created_at?->toIso8601String(),
        ];
    }

    private function resolveTicket(string $ticketId): Ticket
    {
        return Ticket::query()
            ->where('nomor_ticket', $ticketId)
            ->orWhere('id', $ticketId)
            ->firstOrFail();
    }

    private function elevatedPriority(string $currentPriority, string $severity): string
    {
        if ($severity === 'critical') {
            return 'CRITICAL';
        }

        if (in_array($severity, ['high', 'critical'], true) && in_array($currentPriority, ['LOW', 'MEDIUM'], true)) {
            return 'HIGH';
        }

        return $currentPriority;
    }

    private function guardSchema(): ?JsonResponse
    {
        if (!Schema::hasTable('escalations')) {
            return response()->json([
                'success' => false,
                'message' => 'Tabel escalations belum tersedia. Jalankan migrate terlebih dahulu.',
                'data' => null,
            ], 500);
        }

        return null;
    }

    private function guardStoreSchema(): ?JsonResponse
    {
        if (!Schema::hasTable('escalations')) {
            return response()->json([
                'success' => false,
                'message' => 'Tabel escalations belum tersedia. Jalankan migrate terlebih dahulu.',
                'data' => null,
            ], 500);
        }

        $requiredColumns = [
            'ticket_id',
            'branch_id',
            'area_id',
            'reason',
            'note',
            'escalated_by',
            'type',
            'severity',
            'impact',
            'requires_immediate_action',
            'description',
            'status',
        ];

        $missingColumns = collect($requiredColumns)
            ->reject(fn (string $column) => Schema::hasColumn('escalations', $column))
            ->values()
            ->all();

        if ($missingColumns !== []) {
            return response()->json([
                'success' => false,
                'message' => 'Skema escalations belum lengkap. Kolom yang hilang: '.implode(', ', $missingColumns).'. Jalankan migrate terbaru.',
                'data' => null,
            ], 500);
        }

        return null;
    }
}
