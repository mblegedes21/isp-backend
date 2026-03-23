<?php

namespace App\Http\Controllers\Api;

use App\Events\TicketAssigned;
use App\Events\TicketStatusUpdated;
use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketAssignment;
use App\Models\TicketMaterial;
use App\Models\TicketMaterialAssignment;
use App\Services\ApiActorResolver;
use App\Services\AuditLogger;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class TicketWorkflowController extends Controller
{
    public function assign(Request $request, ApiActorResolver $actorResolver, AuditLogger $auditLogger, string $ticketId): JsonResponse
    {
        try {
            Log::info('ticket.assign.request', $request->all());
            $actor = $actorResolver->resolve($request);
            $actorResolver->ensureRole($actor, ['LEADER', 'MANAGER', 'NOC']);

            $data = $request->validate([
                'leader_id' => ['nullable', 'exists:users,id'],
                'priority' => ['nullable', 'in:LOW,MEDIUM,HIGH,CRITICAL'],
                'technicians' => ['required', 'array', 'min:1'],
                'technicians.*' => ['required', 'integer', 'exists:users,id'],
                'materials' => ['required', 'array', 'min:1'],
                'materials.*.material_id' => ['required', 'integer', 'exists:materials,id'],
                'materials.*.teknisi_id' => ['nullable', 'integer', 'exists:users,id'],
                'materials.*.technician_id' => ['nullable', 'integer', 'exists:users,id'],
                'materials.*.quantity' => ['required', 'numeric', 'min:1'],
            ]);

            $ticket = $this->resolveTicket($ticketId);
            abort_unless($ticket->isReadyForAssignment(), 422, 'Ticket sudah ditugaskan.');
            abort_if(!empty($ticket->technician_id), 422, 'Ticket sudah ditugaskan.');
            abort_if($ticket->technicians()->exists(), 422, 'Ticket sudah ditugaskan.');
            abort_if($ticket->materials()->exists() || $ticket->materialAssignments()->exists(), 422, 'Ticket sudah memiliki material yang ditugaskan.');

            $technicianIds = collect($data['technicians'])
                ->map(fn ($id) => (int) $id)
                ->unique()
                ->values();

            $materials = collect($data['materials'])
                ->map(fn (array $row) => [
                    'material_id' => (int) $row['material_id'],
                    'teknisi_id' => (int) ($row['teknisi_id'] ?? $row['technician_id'] ?? 0),
                    'quantity' => (int) $row['quantity'],
                ])
                ->values();

            $invalidTechnician = $materials
                ->first(fn (array $row) => !$technicianIds->contains($row['teknisi_id']));
            abort_if($invalidTechnician !== null, 422, 'Setiap material harus dipetakan ke teknisi yang dipilih.');

            $before = $ticket->toArray();

            DB::transaction(function () use ($ticket, $data, $technicianIds, $materials, $actor) {
                $ticket->update([
                    'leader_id' => $data['leader_id'] ?? $ticket->leader_id,
                    'technician_id' => $technicianIds->first(),
                    'priority' => $data['priority'] ?? $ticket->priority ?? 'MEDIUM',
                    'status' => 'ASSIGNED',
                ]);

                $ticket->technicians()->sync($technicianIds->all());

                TicketAssignment::query()->create([
                    'ticket_id' => $ticket->id,
                    'branch_id' => $ticket->branch_id,
                    'area_id' => $ticket->area_id,
                    'leader_id' => $data['leader_id'] ?? $ticket->leader_id,
                    'technician_id' => $technicianIds->first(),
                    'assigned_by' => $actor->id,
                    'status' => 'ASSIGNED',
                ]);

                foreach ($materials as $material) {
                    $ticketMaterial = TicketMaterial::query()->create([
                        'ticket_id' => $ticket->id,
                        'branch_id' => $ticket->branch_id,
                        'area_id' => $ticket->area_id,
                        'material_id' => $material['material_id'],
                        'teknisi_id' => $material['teknisi_id'],
                        'technician_id' => $material['teknisi_id'],
                        'quantity' => $material['quantity'],
                        'source_type' => 'LEADER_ASSIGNMENT',
                        'product_id' => $material['material_id'],
                        'qty' => $material['quantity'],
                    ]);

                    Log::info('ticket.assign.material_saved', [
                        'ticket_id' => $ticket->id,
                        'ticket_material_id' => $ticketMaterial->id,
                        'material_id' => $material['material_id'],
                        'teknisi_id' => $material['teknisi_id'],
                        'quantity' => $material['quantity'],
                    ]);

                    $assignment = TicketMaterialAssignment::query()->updateOrCreate(
                        [
                            'ticket_id' => $ticket->id,
                            'technician_id' => $material['teknisi_id'],
                            'material_id' => $material['material_id'],
                        ],
                        [
                            'ticket_material_request_id' => null,
                            'quantity_assigned' => $material['quantity'],
                            'quantity_returned' => 0,
                        ]
                    );

                    Log::info('ticket.assign.material_assignment_saved', [
                        'ticket_id' => $ticket->id,
                        'assignment_id' => $assignment->id,
                        'material_id' => $material['material_id'],
                        'teknisi_id' => $material['teknisi_id'],
                        'quantity_assigned' => $material['quantity'],
                    ]);
                }
            });

            $auditLogger->write(
                action: 'ticket.assigned',
                module: 'tickets',
                entityType: Ticket::class,
                entityId: $ticket->id,
                beforeState: $before,
                afterState: $ticket->fresh()->toArray(),
                userId: $actor->id,
                branchId: $ticket->branch_id,
                areaId: $ticket->area_id,
                request: $request,
            );

            TicketAssigned::dispatch($ticket->fresh());

            return response()->json([
                'success' => true,
                'message' => 'Tiket berhasil diassign.',
                'data' => $ticket->fresh(['leader:id,name', 'technician:id,name', 'technicians:id,name']),
            ]);
        } catch (ValidationException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi assign ticket gagal.',
                'errors' => $exception->errors(),
                'data' => null,
            ], 422);
        } catch (HttpExceptionInterface $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage() ?: 'Gagal mengassign tiket.',
                'data' => null,
            ], $exception->getStatusCode());
        } catch (QueryException $exception) {
            Log::error('ticket.assign.query_exception', [
                'ticket_id' => $ticketId,
                'payload' => $request->all(),
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => [
                    'materials' => ['Schema material tiket belum sinkron. Jalankan migrate agar kolom material_id, technician_id, dan quantity tersedia.'],
                ],
                'data' => null,
            ], 422);
        } catch (Throwable $exception) {
            report($exception);
            Log::error('ticket.assign.failed', [
                'ticket_id' => $ticketId,
                'payload' => $request->all(),
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage() ?: 'Gagal mengassign tiket.',
                'data' => null,
            ], method_exists($exception, 'getStatusCode') ? $exception->getStatusCode() : 500);
        }
    }

    public function storeMaterials(Request $request, ApiActorResolver $actorResolver): JsonResponse
    {
        $actor = $actorResolver->resolve($request);
        $actorResolver->ensureRole($actor, ['LEADER', 'MANAGER', 'NOC']);

        $data = $request->validate([
            'ticket_id' => ['required'],
            'material_id' => ['required', 'integer', 'exists:materials,id'],
            'teknisi_id' => ['required', 'integer', 'exists:users,id'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $ticket = $this->resolveTicket((string) $data['ticket_id']);

        $row = TicketMaterial::query()->create([
            'ticket_id' => $ticket->id,
            'branch_id' => $ticket->branch_id,
            'area_id' => $ticket->area_id,
            'material_id' => (int) $data['material_id'],
            'teknisi_id' => (int) $data['teknisi_id'],
            'technician_id' => (int) $data['teknisi_id'],
            'quantity' => (int) $data['quantity'],
            'source_type' => 'LEADER_ASSIGNMENT',
            'product_id' => (int) $data['material_id'],
            'qty' => (int) $data['quantity'],
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => (int) $row->id,
                'ticket_id' => (int) $row->ticket_id,
                'material_id' => (int) $row->material_id,
                'teknisi_id' => (int) ($row->teknisi_id ?: $row->technician_id),
                'quantity' => (int) $row->quantity,
            ],
        ], 201);
    }

    public function transition(Request $request, ApiActorResolver $actorResolver, AuditLogger $auditLogger, string $ticketId)
    {
        $actor = $actorResolver->resolve($request);
        $ticket = $this->resolveTicket($ticketId);

        if ($actor->isTechnician()) {
            abort_unless((int) $ticket->technician_id === (int) $actor->id, 403, 'Tiket ini bukan milik teknisi aktif.');
        }

        $data = $request->validate([
            'status' => ['required', 'in:CREATED,ASSIGNED,MATERIAL_PREPARED,IN_PROGRESS,ESCALATED,COMPLETED,PENDING_MANAGER_REVIEW,CLOSED,CLOSED_WITH_LOSS'],
        ]);

        if (in_array($data['status'], ['CLOSED', 'CLOSED_WITH_LOSS'], true)) {
            abort_if($ticket->hasOpenEscalation(), 422, 'Tiket tidak dapat ditutup karena masih ada eskalasi yang belum selesai.');
        }

        $before = $ticket->toArray();
        $ticket->update(['status' => $data['status']]);

        $auditLogger->write(
            action: 'ticket.status.changed',
            module: 'tickets',
            entityType: Ticket::class,
            entityId: $ticket->id,
            beforeState: $before,
            afterState: $ticket->fresh()->toArray(),
            userId: $actor->id,
            branchId: $ticket->branch_id,
            areaId: $ticket->area_id,
            request: $request,
        );

        TicketStatusUpdated::dispatch($ticket->fresh());

        return response()->json([
            'ok' => true,
            'message' => 'Status tiket berhasil diperbarui.',
            'data' => $ticket->fresh(),
        ]);
    }

    public function supportTeam(Request $request, ApiActorResolver $actorResolver, AuditLogger $auditLogger, string $ticketId)
    {
        $actor = $actorResolver->resolve($request);
        $actorResolver->ensureRole($actor, ['MANAGER', 'LEADER', 'NOC']);
        $ticket = $this->resolveTicket($ticketId);
        $before = $ticket->toArray();

        $ticket->update([
            'priority' => $ticket->priority === 'LOW' ? 'MEDIUM' : $ticket->priority,
        ]);

        $auditLogger->write(
            action: 'ticket.support_team.sent',
            module: 'tickets',
            entityType: Ticket::class,
            entityId: $ticket->id,
            beforeState: $before,
            afterState: $ticket->fresh()->toArray(),
            userId: $actor->id,
            branchId: $ticket->branch_id,
            areaId: $ticket->area_id,
            request: $request,
        );

        return response()->json(['ok' => true, 'message' => 'Tim tambahan sudah dikirim.']);
    }

    public function reviewCompletion(Request $request, ApiActorResolver $actorResolver, AuditLogger $auditLogger, string $ticketId)
    {
        $actor = $actorResolver->resolve($request);
        $actorResolver->ensureRole($actor, ['LEADER', 'MANAGER']);
        $ticket = $this->resolveTicket($ticketId);

        $data = $request->validate([
            'decision' => ['required', 'in:APPROVE,REJECT'],
            'note' => ['nullable', 'string'],
        ]);

        $before = $ticket->toArray();
        if ($data['decision'] === 'APPROVE') {
            abort_if($ticket->hasOpenEscalation(), 422, 'Tiket tidak dapat ditutup karena masih ada eskalasi yang belum selesai.');
        }

        $ticket->update([
            'status' => $data['decision'] === 'APPROVE' ? 'CLOSED' : 'IN_PROGRESS',
        ]);

        $auditLogger->write(
            action: 'ticket.completion.reviewed',
            module: 'tickets',
            entityType: Ticket::class,
            entityId: $ticket->id,
            beforeState: $before,
            afterState: ['status' => $ticket->status, 'decision' => $data['decision'], 'note' => $data['note']],
            userId: $actor->id,
            branchId: $ticket->branch_id,
            areaId: $ticket->area_id,
            request: $request,
        );

        return response()->json([
            'ok' => true,
            'message' => $data['decision'] === 'APPROVE' ? 'Pekerjaan disetujui.' : 'Pekerjaan dikembalikan ke teknisi.',
            'data' => $ticket->fresh(),
        ]);
    }

    protected function resolveTicket(string $ticketId): Ticket
    {
        return Ticket::query()
            ->where('nomor_ticket', $ticketId)
            ->orWhere('id', $ticketId)
            ->firstOrFail();
    }
}
