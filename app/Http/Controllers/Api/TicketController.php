<?php

namespace App\Http\Controllers\Api;

use App\Events\TicketAssigned;
use App\Events\TicketCreated;
use App\Events\TicketEscalated;
use App\Events\TicketStatusUpdated;
use App\Http\Controllers\Controller;
use App\Jobs\RecalculateManagerStatistics;
use App\Jobs\RecalculateTechnicianPerformanceMetrics;
use App\Models\Area;
use App\Models\Branch;
use App\Models\Ticket;
use App\Models\TicketAssignment;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TicketController extends Controller
{
    private const JOB_TYPES = ['Tarik Kabel', 'Pemasangan Baru', 'Maintenance'];

    public function index(Request $request)
    {
        try {
            $query = Ticket::with($this->ticketRelations())->latest();
            $actor = $request->user();

            if ($actor && in_array(User::databaseRole((string) $actor->role), [User::ROLE_NOC, User::ROLE_MITRA], true)) {
                $query->where('created_by', $actor->id);
            }

            if ($request->filled('status')) {
                $status = strtoupper((string) $request->string('status'));

                if ($status === 'NEW') {
                    $query->whereIn('status', ['CREATED', 'NEW']);
                } elseif ($status === 'OPEN') {
                    $query->whereIn('status', ['OPEN', 'ASSIGNED', 'MATERIAL_PREPARED', 'IN_PROGRESS']);
                } else {
                    $query->where('status', $status);
                }
            }

            if ($request->filled('area_id')) {
                $query->where('area_id', $request->integer('area_id'));
            }

            if ($request->filled('branch_id')) {
                $query->where('branch_id', $request->integer('branch_id'));
            }

            $tickets = $query->paginate((int) $request->integer('per_page', 20));

            return response()->json([
                'success' => true,
                'message' => 'Ticket list loaded.',
                'data' => $tickets->through(fn (Ticket $ticket) => $this->serializeTicket($ticket)),
            ]);
        } catch (QueryException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat daftar tiket.',
                'errors' => [
                    'tickets' => [$exception->getMessage()],
                ],
                'data' => [],
            ], 500);
        }
    }

    public function store(Request $request, AuditLogger $auditLogger)
    {
        $data = $request->validate([
            'customer_location' => ['required', 'string', 'max:255'],
            'issue_type' => ['required', 'string', 'max:255'],
            'priority' => ['required', 'string', 'max:50'],
            'branch' => ['required', 'string', 'max:100'],
            'description' => ['required', 'string'],
            'title' => ['nullable', 'string', 'max:150'],
            'area_id' => ['nullable', 'exists:areas,id'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'problem_type' => ['nullable', 'string', 'max:80'],
            'status' => ['sometimes', Rule::in(Ticket::STATUS_FLOW)],
            'leader_id' => ['nullable', 'exists:users,id'],
            'technician_id' => ['nullable', 'exists:users,id'],
            'created_by' => ['nullable', 'exists:users,id'],
            'nomor_ticket' => ['nullable', 'string', 'max:60', 'unique:tickets,nomor_ticket'],
            'jenis_pekerjaan' => ['nullable', 'string', 'max:120'],
        ]);

        $data['title'] = $data['title'] ?? $data['customer_location'];
        $data['problem_type'] = $data['problem_type'] ?? $data['issue_type'];
        $data['priority'] = $this->normalizePriority($data['priority']);
        $data['technician_id'] = $data['technician_id'] ?? null;
        $data['leader_id'] = $data['leader_id'] ?? null;

        if (!isset($data['status'])) {
            $data['status'] = 'CREATED';
        }

        if (!isset($data['nomor_ticket'])) {
            $data['nomor_ticket'] = 'TCK-' . now()->format('Ymd-His');
        }

        $data['jenis_pekerjaan'] = $this->normalizeJobType($data['jenis_pekerjaan'] ?? $data['problem_type'] ?? null);

        $creator = $request->user();
        $branchId = $data['branch_id'] ?? null;
        if (!$branchId) {
            $branchId = Branch::query()
                ->where('name', $data['branch'])
                ->orWhere('code', $data['branch'])
                ->value('id');
        }
        abort_if(!$branchId && !$creator?->branch_id, 422, 'Cabang tidak ditemukan.');
        $resolvedArea = $this->resolveArea(
            $data['area_id'] ?? null,
            $branchId ?? $creator?->branch_id
        );
        $data['area_id'] = $resolvedArea?->id;
        $data['branch_id'] = $resolvedArea?->branch_id ?? $branchId ?? $creator?->branch_id;
        $data['created_by'] = $data['created_by'] ?? $creator?->id;

        $ticket = DB::transaction(function () use ($auditLogger, $data, $request) {
            $ticket = Ticket::create($data);

            if (!empty($data['leader_id']) || !empty($data['technician_id'])) {
                TicketAssignment::create([
                    'ticket_id' => $ticket->id,
                    'branch_id' => $ticket->branch_id,
                    'area_id' => $ticket->area_id,
                    'leader_id' => $ticket->leader_id,
                    'technician_id' => $ticket->technician_id,
                    'assigned_by' => $request->user()?->id ?? $ticket->created_by,
                    'status' => 'ASSIGNED',
                ]);
            }

            $auditLogger->write(
                action: 'ticket.created',
                module: 'tickets',
                entityType: Ticket::class,
                entityId: $ticket->id,
                afterState: $ticket->toArray(),
                userId: $request->user()?->id ?? $ticket->created_by,
                branchId: $ticket->branch_id,
                areaId: $ticket->area_id,
                request: $request,
            );

            return $ticket;
        });

        TicketCreated::dispatch($ticket);

        if ($ticket->technician_id || $ticket->leader_id) {
            TicketAssigned::dispatch($ticket);
        }

        RecalculateManagerStatistics::dispatch();
        RecalculateTechnicianPerformanceMetrics::dispatch();

        $ticket = $ticket->load(['area', 'branch', 'leader', 'technician', 'technicians', 'creator']);

        return response()->json([
            'success' => true,
            'message' => 'Tiket berhasil dibuat',
            'data' => $this->serializeTicket($ticket),
        ]);
    }

    public function show(Request $request, string $ticketId)
    {
        try {
            $ticket = $this->resolveTicket($ticketId);
            $actor = $request->user();
            if ($actor && in_array(User::databaseRole((string) $actor->role), [User::ROLE_NOC, User::ROLE_MITRA], true) && (int) $ticket->created_by !== (int) $actor->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tiket ini bukan milik akun aktif.',
                    'data' => null,
                ], 403);
            }

            return response()->json([
                'success' => true,
                'message' => 'Ticket detail loaded.',
                'data' => $this->serializeTicket($ticket->load(array_merge($this->ticketRelations(), ['escalations.escalator']))),
            ]);
        } catch (QueryException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat detail tiket.',
                'errors' => [
                    'tickets' => [$exception->getMessage()],
                ],
                'data' => null,
            ], 500);
        }
    }

    public function update(Request $request, string $ticketId, AuditLogger $auditLogger)
    {
        $ticket = $this->resolveTicket($ticketId);
        $before = $ticket->replicate()->toArray();
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'area_id' => ['sometimes', 'exists:areas,id'],
            'branch_id' => ['sometimes', 'exists:branches,id'],
            'problem_type' => ['sometimes', 'string', 'max:80'],
            'priority' => ['sometimes', Rule::in(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])],
            'status' => ['sometimes', Rule::in(Ticket::STATUS_FLOW)],
            'leader_id' => ['nullable', 'exists:users,id'],
            'technician_id' => ['nullable', 'exists:users,id'],
            'jenis_pekerjaan' => ['nullable', 'string', 'max:120'],
        ]);

        if (($data['status'] ?? null) === 'ESCALATED') {
            $data['escalated_at'] = now();
        }

        if (array_key_exists('area_id', $data) || array_key_exists('branch_id', $data)) {
            $resolvedArea = $this->resolveArea(
                $data['area_id'] ?? $ticket->area_id,
                $data['branch_id'] ?? $ticket->branch_id
            );
            $data['area_id'] = $resolvedArea?->id;
            $data['branch_id'] = $resolvedArea?->branch_id ?? $data['branch_id'] ?? $ticket->branch_id;
        }

        if (array_key_exists('jenis_pekerjaan', $data) || array_key_exists('problem_type', $data)) {
            $data['jenis_pekerjaan'] = $this->normalizeJobType($data['jenis_pekerjaan'] ?? $data['problem_type'] ?? $ticket->jenis_pekerjaan);
        }

        $ticket->update($data);
        $ticket = $ticket->fresh()->load(['area', 'leader', 'technician', 'technicians', 'creator']);

        if (isset($data['leader_id']) || isset($data['technician_id'])) {
            TicketAssignment::create([
                'ticket_id' => $ticket->id,
                'branch_id' => $ticket->branch_id,
                'area_id' => $ticket->area_id,
                'leader_id' => $ticket->leader_id,
                'technician_id' => $ticket->technician_id,
                'assigned_by' => $request->user()?->id,
                'status' => 'REASSIGNED',
            ]);

            TicketAssigned::dispatch($ticket);
        }

        if (isset($data['status'])) {
            TicketStatusUpdated::dispatch($ticket);
        }

        if (($data['status'] ?? null) === 'ESCALATED') {
            TicketEscalated::dispatch($ticket);
        }

        $auditLogger->write(
            action: 'ticket.updated',
            module: 'tickets',
            entityType: Ticket::class,
            entityId: $ticket->id,
            beforeState: $before,
            afterState: $ticket->toArray(),
            userId: $request->user()?->id,
            branchId: $ticket->branch_id,
            areaId: $ticket->area_id,
            request: $request,
        );

        RecalculateManagerStatistics::dispatch();
        RecalculateTechnicianPerformanceMetrics::dispatch();

        return response()->json([
            'success' => true,
            'message' => 'Ticket updated successfully.',
            'data' => $this->serializeTicket($ticket),
        ]);
    }

    private function serializeTicket(Ticket $ticket): array
    {
        return [
            'id' => $ticket->id,
            'nomor_ticket' => $ticket->nomor_ticket,
            'title' => $ticket->title,
            'description' => $ticket->description,
            'area_id' => $ticket->area_id,
            'branch_id' => $ticket->branch_id,
            'branch' => $ticket->branch?->name ?? $ticket->area?->name ?? '-',
            'problem_type' => $ticket->problem_type,
            'priority' => $ticket->priority,
            'status' => $ticket->status,
            'created_by' => $ticket->created_by,
            'leader_id' => $ticket->leader_id,
            'technician_id' => $ticket->technician_id,
            'leader' => $ticket->leader ? ['id' => $ticket->leader->id, 'name' => $ticket->leader->name] : null,
            'technician' => $ticket->technician ? ['id' => $ticket->technician->id, 'name' => $ticket->technician->name] : null,
            'technicians' => $ticket->relationLoaded('technicians')
                ? $ticket->technicians->map(fn ($technician) => ['id' => $technician->id, 'name' => $technician->name])->values()
                : [],
            'creator' => $ticket->creator ? ['id' => $ticket->creator->id, 'name' => $ticket->creator->name] : null,
            'area' => $ticket->area ? ['id' => $ticket->area->id, 'name' => $ticket->area->name] : null,
            'customer_location' => $ticket->title,
            'issue_type' => $ticket->problem_type,
            'created_at' => $ticket->created_at?->toIso8601String(),
            'updated_at' => $ticket->updated_at?->toIso8601String(),
            'escalations' => $ticket->relationLoaded('escalations')
                ? $ticket->escalations->map(fn ($escalation) => [
                    'id' => $escalation->id,
                    'type' => $escalation->type,
                    'severity' => $escalation->severity,
                    'impact' => $escalation->impact,
                    'requires_immediate_action' => (bool) $escalation->requires_immediate_action,
                    'description' => $escalation->description ?: $escalation->note,
                    'status' => $escalation->status,
                    'created_by' => $escalation->created_by ?: $escalation->escalated_by,
                    'created_by_name' => $escalation->creator?->name ?? $escalation->escalator?->name,
                    'role' => $escalation->role,
                    'handled_by' => $escalation->handled_by,
                    'handled_by_name' => $escalation->handler?->name,
                    'handled_at' => $escalation->handled_at?->toIso8601String(),
                    'reason' => $escalation->reason,
                    'note' => $escalation->note,
                    'escalated_to' => $escalation->note,
                    'escalated_by' => $escalation->escalated_by,
                    'created_at' => $escalation->created_at?->toIso8601String(),
                ])->values()
                : [],
        ];
    }

    private function resolveArea(?int $areaId, ?int $branchId): ?Area
    {
        if ($areaId) {
            return Area::query()->find($areaId);
        }

        if (!$branchId) {
            return null;
        }

        $branch = Branch::query()->find($branchId);
        if (!$branch) {
            return null;
        }

        return Area::query()->firstOrCreate(
            ['branch_id' => $branch->id, 'code' => 'AR-'.$branch->code],
            ['name' => 'Area '.$branch->name, 'is_active' => true],
        );
    }

    private function resolveTicket(string $ticketId): Ticket
    {
        return Ticket::query()
            ->where('nomor_ticket', $ticketId)
            ->orWhere('id', $ticketId)
            ->firstOrFail();
    }

    private function ticketRelations(): array
    {
        $relations = ['area:id,name,code', 'leader:id,name', 'technician:id,name', 'creator:id,name', 'branch:id,name', 'escalations.creator:id,name', 'escalations.handler:id,name', 'escalations.escalator:id,name'];

        if (
            Schema::hasTable('ticket_technicians') &&
            Schema::hasColumn('ticket_technicians', 'created_at') &&
            Schema::hasColumn('ticket_technicians', 'updated_at')
        ) {
            $relations[] = 'technicians:id,name';
        }

        return $relations;
    }

    private function normalizeJobType(?string $jobType): string
    {
        $value = trim((string) $jobType);

        if (in_array($value, self::JOB_TYPES, true)) {
            return $value;
        }

        $lower = strtolower($value);

        if (str_contains($lower, 'maint')) {
            return 'Maintenance';
        }

        if (str_contains($lower, 'pasang') || str_contains($lower, 'baru') || str_contains($lower, 'install')) {
            return 'Pemasangan Baru';
        }

        return 'Tarik Kabel';
    }

    private function normalizePriority(?string $priority): string
    {
        $value = strtoupper(trim((string) $priority));

        return match ($value) {
            'RENDAH', 'LOW' => 'LOW',
            'SEDANG', 'MEDIUM' => 'MEDIUM',
            'TINGGI', 'HIGH' => 'HIGH',
            'KRITIS', 'CRITICAL' => 'CRITICAL',
            default => 'MEDIUM',
        };
    }
}
