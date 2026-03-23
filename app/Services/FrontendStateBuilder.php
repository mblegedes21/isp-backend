<?php

namespace App\Services;

use App\Models\Area;
use App\Models\AreaAction;
use App\Models\Attendance;
use App\Models\AttendanceFlag;
use App\Models\AuditLog;
use App\Models\Escalation;
use App\Models\Incident;
use App\Models\LossReport;
use App\Models\Material;
use App\Models\MaterialBrand;
use App\Models\MaterialCategory;
use App\Models\PurchaseRequest;
use App\Models\StockAudit;
use App\Models\StockTransaction;
use App\Models\StockTransfer;
use App\Models\TechnicianLocationLog;
use App\Models\Ticket;
use App\Models\TicketMaterial;
use App\Models\TicketMaterialRequest;
use App\Models\TicketMaterialReport;
use App\Models\TicketProgressPhoto;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class FrontendStateBuilder
{
    public function build(): array
    {
        $ticketRelations = ['leader:id,name', 'technician:id,name', 'area:id,name'];

        if (
            Schema::hasTable('ticket_technicians') &&
            Schema::hasColumn('ticket_technicians', 'created_at') &&
            Schema::hasColumn('ticket_technicians', 'updated_at')
        ) {
            $ticketRelations[] = 'technicians:id,name';
        }

        $escalations = $this->safeEscalations();

        return [
            'tickets' => $this->safeCollection('app_state.tickets', fn () => Ticket::query()->with($ticketRelations)->latest()->get()->map(fn (Ticket $ticket) => $this->mapTicket($ticket))->values()),
            'escalations' => $escalations ?? [],
            'attendanceHistory' => $this->safeCollection('app_state.attendance_history', fn () => Attendance::query()->with(['user:id,name', 'area:id,name'])->latest('date')->get()->map(fn (Attendance $attendance) => $this->mapAttendance($attendance))->values()),
            'attendanceFlags' => $this->safeCollection('app_state.attendance_flags', fn () => AttendanceFlag::query()->latest()->get()->keyBy('attendance_id')),
            'stockItems' => $this->safeCollection('app_state.stock_items', fn () => Material::query()->with(['branch:id,name', 'category:id,name', 'brandOption:id,name,category_id'])->latest()->get()->map(fn (Material $material) => $this->mapMaterial($material))->values()),
            'materialCategories' => $this->safeCollection('app_state.material_categories', fn () => MaterialCategory::query()->orderBy('name')->get(['id', 'name', 'description'])->values()),
            'materialBrands' => $this->safeCollection('app_state.material_brands', fn () => MaterialBrand::query()->orderBy('name')->get(['id', 'category_id', 'name'])->values()),
            'stockTransactions' => $this->safeCollection('app_state.stock_transactions', fn () => StockTransaction::query()->with(['material:id,name,brand,category_id,unit', 'material.category:id,name', 'branch:id,name'])->latest()->limit(200)->get()->map(fn (StockTransaction $transaction) => $this->mapStockTransaction($transaction))->values()),
            'purchaseRequests' => $this->safeCollection('app_state.purchase_requests', fn () => PurchaseRequest::query()->with(['material:id,name,brand', 'branch:id,name', 'requester:id,name'])->latest()->limit(200)->get()->map(fn (PurchaseRequest $request) => $this->mapPurchaseRequest($request))->values()),
            'stockAudits' => $this->safeCollection('app_state.stock_audits', fn () => StockAudit::query()->with(['material:id,name,brand', 'branch:id,name', 'creator:id,name'])->latest()->limit(200)->get()->map(fn (StockAudit $audit) => $this->mapStockAudit($audit))->values()),
            'ticketMaterialRequests' => $this->safeCollection('app_state.ticket_material_requests', fn () => TicketMaterialRequest::query()->with(['ticket:id,nomor_ticket', 'material:id,name,brand,unit', 'requester:id,name'])->latest()->get()->map(fn (TicketMaterialRequest $material) => $this->mapTicketMaterialRequest($material))->values()),
            'stockTransfers' => $this->safeCollection('app_state.stock_transfers', fn () => StockTransfer::query()->latest()->get()->map(fn (StockTransfer $transfer) => $this->mapStockTransfer($transfer))->values()),
            'lossReports' => $this->safeCollection('app_state.loss_reports', fn () => LossReport::query()->latest()->get()->map(fn (LossReport $loss) => $this->mapLoss($loss))->values()),
            'materialReports' => $this->safeCollection('app_state.material_reports', fn () => TicketMaterialReport::query()->with(['ticket:id,nomor_ticket', 'material:id,name,brand,unit'])->latest()->get()->map(fn (TicketMaterialReport $report) => $this->mapMaterialReport($report))->values()),
            'locationLogs' => $this->safeCollection('app_state.location_logs', fn () => TechnicianLocationLog::query()->latest()->limit(200)->get()->map(fn (TechnicianLocationLog $log) => $this->mapLocationLog($log))->values()),
            'progressPhotos' => $this->safeCollection('app_state.progress_photos', fn () => TicketProgressPhoto::query()->latest()->limit(200)->get()->map(fn (TicketProgressPhoto $photo) => $this->mapProgressPhoto($photo))->values()),
            'auditLogs' => $this->safeCollection('app_state.audit_logs', fn () => AuditLog::query()->latest()->limit(200)->get()->map(fn (AuditLog $log) => $this->mapAuditLog($log))->values()),
            'incidents' => $this->safeCollection('app_state.incidents', fn () => Incident::query()->with('area:id,name')->latest('detected_at')->get()->map(fn (Incident $incident) => $this->mapIncident($incident))->values()),
            'areaActions' => $this->safeCollection('app_state.area_actions', fn () => AreaAction::query()->latest()->limit(100)->get()->map(fn (AreaAction $action) => $this->mapAreaAction($action))->values()),
            'leaders' => $this->safeCollection('app_state.leaders', fn () => User::query()->where('role', User::ROLE_LEADER)->orderBy('name')->get(['id', 'name', 'area_id'])->map(function (User $user) {
                return [
                    'id' => (string) $user->id,
                    'name' => $user->name,
                    'area' => $user->area?->name ?? 'Tanpa Area',
                ];
            })->values()),
            'technicians' => $this->safeCollection('app_state.technicians', fn () => User::query()->where('role', User::ROLE_TEKNISI)->orderBy('name')->get()->map(fn (User $user) => $this->mapTechnician($user))->values()),
            'areas' => $this->safeCollection('app_state.areas', fn () => Area::query()->orderBy('name')->get(['id', 'name', 'code'])->values()),
        ];
    }

    protected function mapTicket(Ticket $ticket): array
    {
        $latestEscalation = null;
        $openEscalationExists = false;
        $ticketEscalations = collect();

        try {
            if (Schema::hasTable('escalations')) {
                $ticketEscalations = $ticket->escalations()->with(['creator:id,name', 'handler:id,name', 'escalator:id,name'])->latest()->get();
                $latestEscalation = $ticketEscalations->first();
                $openEscalationExists = $ticketEscalations->contains(fn ($escalation) => in_array($escalation->status ?? 'pending', Escalation::OPEN_STATUSES, true));
            }
        } catch (\Exception $exception) {
            Log::error('Escalation error: '.$exception->getMessage(), [
                'ticket_id' => $ticket->id,
            ]);
        }

        return [
            'id' => (string) ($ticket->nomor_ticket ?: $ticket->id),
            'dbId' => $ticket->id,
            'title' => $ticket->title ?? 'Ticket',
            'description' => $ticket->description ?? '',
            'areaId' => (string) ($ticket->area_id ?? ''),
            'ticketLatitude' => $ticket->ticket_latitude ? (float) $ticket->ticket_latitude : null,
            'ticketLongitude' => $ticket->ticket_longitude ? (float) $ticket->ticket_longitude : null,
            'validRadiusMeter' => $ticket->valid_radius_meter,
            'problemType' => $ticket->problem_type ?? '-',
            'priority' => $ticket->priority,
            'leaderId' => $ticket->leader_id ? (string) $ticket->leader_id : null,
            'technicianId' => $ticket->technician_id ? (string) $ticket->technician_id : null,
            'technicians' => $ticket->technicians->map(fn (User $user) => ['id' => (string) $user->id, 'name' => $user->name])->values(),
            'createdBy' => (string) ($ticket->created_by ?? ''),
            'branch' => $ticket->area?->name ?? 'Tanpa Area',
            'assignee' => $ticket->technicians->pluck('name')->filter()->implode(', ') ?: ($ticket->technician?->name ?? ''),
            'status' => $ticket->status,
            'estimatedLossPercent' => (float) ($ticket->estimated_loss_percent ?? 0),
            'escalated' => $openEscalationExists || $ticket->status === 'ESCALATED',
            'escalationReason' => (string) ($latestEscalation?->description ?: $latestEscalation?->reason ?: ''),
            'escalationStatus' => $latestEscalation?->status,
            'hasOpenEscalation' => $openEscalationExists,
            'escalations' => $ticketEscalations->map(fn ($escalation) => [
                'id' => (string) $escalation->id,
                'ticket_id' => (string) ($ticket->nomor_ticket ?: $ticket->id),
                'ticket_db_id' => (string) $ticket->id,
                'created_by' => (string) ($escalation->created_by ?: $escalation->escalated_by),
                'created_by_name' => $escalation->creator?->name ?? $escalation->escalator?->name,
                'role' => $escalation->role ?? null,
                'type' => $escalation->type ?? $escalation->reason ?? null,
                'severity' => $escalation->severity ?? null,
                'impact' => $escalation->impact ?? null,
                'requires_immediate_action' => (bool) ($escalation->requires_immediate_action ?? false),
                'description' => $escalation->description ?: $escalation->note,
                'status' => $escalation->status ?? 'pending',
                'handled_by' => $escalation->handled_by ? (string) $escalation->handled_by : null,
                'handled_by_name' => $escalation->handler?->name,
                'handled_at' => $escalation->handled_at?->toIso8601String(),
                'created_at' => $escalation->created_at?->toIso8601String(),
            ])->values(),
            'createdAt' => $ticket->created_at?->toIso8601String(),
            'updatedAt' => $ticket->updated_at?->toIso8601String(),
        ];
    }

    protected function mapAttendance(Attendance $attendance): array
    {
        $flag = AttendanceFlag::query()->where('attendance_id', $attendance->id)->latest()->first();
        $leaderName = User::query()
            ->where('role', User::ROLE_LEADER)
            ->where('area_id', $attendance->area_id)
            ->value('name');

        return [
            'id' => (string) $attendance->id,
            'userId' => (string) $attendance->user_id,
            'technicianName' => $attendance->user?->name,
            'area' => $attendance->area?->name ?? 'Tanpa Area',
            'leaderName' => $leaderName,
            'date' => optional($attendance->date)->format('Y-m-d'),
            'checkInAt' => $attendance->check_in?->format('H:i'),
            'checkOutAt' => $attendance->check_out?->format('H:i'),
            'gps' => $attendance->gps,
            'photo' => $attendance->photo_path ?? $attendance->photo,
            'photoPath' => $attendance->photo_path ?? $attendance->photo,
            'latitude' => $attendance->latitude ? (float) $attendance->latitude : null,
            'longitude' => $attendance->longitude ? (float) $attendance->longitude : null,
            'accuracy' => $attendance->accuracy ? (float) $attendance->accuracy : null,
            'flagged' => (bool) $attendance->flagged,
            'flagId' => $flag?->id ? (string) $flag->id : null,
            'flagType' => $flag?->flag_type,
            'reviewStatus' => $flag?->status,
        ];
    }

    protected function mapMaterial(Material $material): array
    {
        $quantity = (int) $material->stock;
        $minimum = (int) $material->minimum_stock;

        return [
            'id' => (string) $material->id,
            'sku' => $material->sku ?? 'SKU-'.$material->id,
            'name' => $material->name,
            'materialName' => trim(collect([$material->brand, $material->name])->filter()->implode(' ')),
            'categoryId' => (string) $material->category_id,
            'category' => $material->category?->name ?? 'Umum',
            'brandId' => $material->brand_id ? (string) $material->brand_id : null,
            'brand' => $material->brand ?? '-',
            'model' => $material->name,
            'unit' => $material->unit ?? 'unit',
            'branchId' => $material->branch_id ? (string) $material->branch_id : null,
            'branch' => $material->branch?->name ?? 'Pusat',
            'quantity' => $quantity,
            'minimum' => $minimum,
            'purchasePrice' => (float) ($material->purchase_price ?? 0),
            'description' => $material->description,
            'isActive' => (bool) $material->is_active,
            'status' => $quantity <= $minimum ? 'LOW_STOCK' : 'NORMAL',
        ];
    }

    protected function mapTicketMaterialRequest(TicketMaterialRequest $material): array
    {
        return [
            'id' => (string) $material->id,
            'ticketId' => (string) ($material->ticket?->nomor_ticket ?: $material->ticket_id),
            'materialId' => (string) $material->material_id,
            'materialName' => trim(collect([$material->material?->brand, $material->material?->name])->filter()->implode(' ')),
            'unit' => $material->material?->unit,
            'qtyRequested' => (int) $material->quantity,
            'requestedBy' => (string) $material->requested_by,
            'requestedByName' => $material->requester?->name ?? '-',
            'requestedRole' => $material->requested_role,
            'status' => $material->status,
            'releasedQuantity' => (int) $material->released_quantity,
            'returnedQuantity' => (int) $material->returned_quantity,
            'createdAt' => $material->created_at?->toIso8601String(),
        ];
    }

    protected function mapStockTransfer(StockTransfer $transfer): array
    {
        return [
            'id' => (string) $transfer->id,
            'itemId' => (string) $transfer->material_id,
            'fromBranch' => $transfer->from_branch,
            'toBranch' => $transfer->to_branch,
            'quantity' => $transfer->quantity,
            'unitPrice' => (float) ($transfer->unit_price ?? 0),
            'totalPrice' => (float) ($transfer->total_price ?? 0),
            'status' => $transfer->status,
            'createdAt' => $transfer->created_at?->toIso8601String(),
        ];
    }

    protected function mapStockTransaction(StockTransaction $transaction): array
    {
        return [
            'id' => (string) $transaction->id,
            'materialId' => (string) $transaction->material_id,
            'materialName' => trim(collect([$transaction->material?->brand, $transaction->material?->name])->filter()->implode(' ')),
            'category' => $transaction->material?->category?->name ?? '-',
            'brand' => $transaction->material?->brand ?? '-',
            'unit' => $transaction->material?->unit ?? 'pcs',
            'branch' => $transaction->branch?->name ?? '-',
            'transactionType' => $transaction->transaction_type ?? $transaction->type,
            'quantity' => (int) $transaction->quantity,
            'unitPrice' => (float) ($transaction->unit_price ?? 0),
            'totalPrice' => (float) ($transaction->total_price ?? 0),
            'notes' => $transaction->notes,
            'createdAt' => $transaction->created_at?->toIso8601String(),
        ];
    }

    protected function mapPurchaseRequest(PurchaseRequest $request): array
    {
        return [
            'id' => (string) $request->id,
            'materialId' => (string) $request->material_id,
            'materialName' => trim(collect([$request->material?->brand, $request->material?->name])->filter()->implode(' ')),
            'branchId' => (string) $request->branch_id,
            'branchName' => $request->branch?->name ?? '-',
            'requestedBy' => (string) $request->requested_by,
            'requestedByName' => $request->requester?->name ?? '-',
            'quantity' => (int) $request->quantity,
            'estimatedPrice' => (float) $request->estimated_price,
            'supplier' => $request->supplier,
            'notes' => $request->notes,
            'status' => $request->status,
            'createdAt' => $request->created_at?->toIso8601String(),
        ];
    }

    protected function mapStockAudit(StockAudit $audit): array
    {
        return [
            'id' => (string) $audit->id,
            'materialId' => (string) $audit->material_id,
            'materialName' => trim(collect([$audit->material?->brand, $audit->material?->name])->filter()->implode(' ')),
            'branchId' => (string) $audit->branch_id,
            'branchName' => $audit->branch?->name ?? '-',
            'systemStock' => (int) $audit->system_stock,
            'physicalStock' => (int) $audit->physical_stock,
            'difference' => (int) $audit->difference,
            'unitPrice' => (float) $audit->unit_price,
            'totalDifferenceValue' => (float) $audit->total_difference_value,
            'notes' => $audit->notes,
            'createdBy' => (string) $audit->created_by,
            'createdByName' => $audit->creator?->name ?? '-',
            'status' => $audit->status,
            'canCreateLoss' => $audit->difference < 0,
            'createdAt' => $audit->created_at?->toIso8601String(),
        ];
    }

    protected function mapLoss(LossReport $loss): array
    {
        return [
            'id' => (string) $loss->id,
            'ticketId' => (string) ($loss->ticket?->nomor_ticket ?: $loss->ticket_id),
            'technicianId' => (string) ($loss->technician_id ?? ''),
            'technicianName' => $loss->technician?->name ?? 'Teknisi',
            'itemId' => (string) ($loss->material_id ?? ''),
            'materialName' => trim(collect([$loss->material?->brand, $loss->material?->name])->filter()->implode(' ')),
            'area' => $loss->area?->name ?? 'Tanpa Area',
            'quantityLost' => (int) $loss->quantity,
            'unitPrice' => (float) ($loss->unit_price ?? 0),
            'totalPrice' => (float) ($loss->total_price ?? 0),
            'lossPercent' => (float) $loss->loss_percent,
            'note' => $loss->reason,
            'photoUrl' => $loss->evidence_path,
            'status' => $loss->status,
            'rejectedReason' => $loss->rejected_reason,
            'investigationStatus' => $loss->status === 'DALAM_INVESTIGASI' ? 'Dalam Investigasi' : null,
            'reviewedAt' => $loss->updated_at?->toIso8601String(),
            'createdAt' => $loss->created_at?->toIso8601String(),
        ];
    }

    protected function mapMaterialReport(TicketMaterialReport $report): array
    {
        return [
            'id' => (string) $report->id,
            'ticketId' => (string) ($report->ticket?->nomor_ticket ?: $report->ticket_id),
            'technicianId' => (string) $report->technician_id,
            'materialId' => (string) ($report->material_id ?? ''),
            'materialName' => trim(collect([$report->material?->brand, $report->material?->name])->filter()->implode(' ')),
            'unit' => $report->material?->unit,
            'used' => (int) ($report->quantity_used ?? 0),
            'remaining' => (int) ($report->quantity_remaining ?? 0),
            'photoPath' => $report->photo_path ?? '',
            'latitude' => $report->latitude ? (float) $report->latitude : 0,
            'longitude' => $report->longitude ? (float) $report->longitude : 0,
            'accuracy' => $report->accuracy ? (float) $report->accuracy : 0,
            'capturedAtServer' => $report->captured_at_server?->toIso8601String(),
            'createdAt' => $report->created_at?->toIso8601String(),
        ];
    }

    protected function mapLocationLog(TechnicianLocationLog $log): array
    {
        return [
            'id' => (string) $log->id,
            'userId' => (string) $log->user_id,
            'technicianName' => $log->user?->name ?? 'Teknisi',
            'ticketId' => $log->ticket ? (string) ($log->ticket->nomor_ticket ?: $log->ticket_id) : null,
            'branch' => $log->branch?->name ?? 'Pusat',
            'area' => $log->area?->name ?? 'Tanpa Area',
            'latitude' => (float) $log->latitude,
            'longitude' => (float) $log->longitude,
            'accuracy' => (float) ($log->accuracy ?? 0),
            'calculatedDistanceMeter' => (int) ($log->calculated_distance_meter ?? 0),
            'locationStatus' => $log->location_status,
            'needsReview' => (bool) ($log->needs_review ?? false),
            'riskScore' => (int) $log->risk_score,
            'riskReasons' => $log->risk_reasons ?? [],
            'sourceType' => $log->source_type,
            'createdAt' => $log->created_at?->toIso8601String(),
        ];
    }

    protected function mapProgressPhoto(TicketProgressPhoto $photo): array
    {
        return [
            'id' => (string) $photo->id,
            'ticketId' => (string) ($photo->ticket?->nomor_ticket ?: $photo->ticket_id),
            'userId' => (string) $photo->user_id,
            'progressType' => $photo->progress_type,
            'imagePath' => $photo->image_path ?? '',
            'imageSizeKb' => (float) ($photo->image_size_kb ?? 0),
            'latitude' => (float) ($photo->latitude ?? 0),
            'longitude' => (float) ($photo->longitude ?? 0),
            'accuracy' => (float) ($photo->accuracy ?? 0),
            'calculatedDistanceMeter' => (int) ($photo->calculated_distance_meter ?? 0),
            'locationStatus' => $photo->location_status,
            'needsReview' => (bool) ($photo->needs_review ?? false),
            'riskScore' => (int) $photo->risk_score,
            'riskReasons' => $photo->risk_reasons ?? [],
            'capturedAtServer' => $photo->captured_at_server?->toIso8601String(),
            'uploadedAtServer' => $photo->uploaded_at_server?->toIso8601String(),
        ];
    }

    protected function mapAuditLog(AuditLog $log): array
    {
        return [
            'id' => (string) $log->id,
            'createdAt' => $log->created_at?->toIso8601String(),
            'user' => $log->user?->email ?? 'system@isp.local',
            'actionType' => strtoupper(str_replace('.', '_', $log->action)),
            'entityType' => class_basename($log->entity_type),
            'entityId' => $log->entity_id,
            'before' => $this->stringifyState($log->before_state),
            'after' => $this->stringifyState($log->after_state),
            'source' => $log->source ?? 'Backend API',
            'reviewStatus' => $log->review_status ?? 'BARU',
        ];
    }

    protected function mapIncident(Incident $incident): array
    {
        return [
            'id' => (string) $incident->id,
            'areaId' => (string) ($incident->area_id ?? ''),
            'areaName' => $incident->area?->name ?? 'Tanpa Area',
            'severity' => $incident->severity,
            'ticketCount' => $incident->ticket_count,
            'escalationCount' => $incident->escalation_count,
            'detectedAt' => $incident->detected_at?->toIso8601String(),
            'responseStatus' => $incident->response_status,
        ];
    }

    protected function mapAreaAction(AreaAction $action): array
    {
        return [
            'id' => (string) $action->id,
            'areaName' => $action->area_name,
            'action' => $action->action,
            'createdAt' => $action->created_at?->toIso8601String(),
        ];
    }

    protected function mapTechnician(User $user): array
    {
        $leaderId = User::query()
            ->where('role', User::ROLE_LEADER)
            ->where('area_id', $user->area_id)
            ->value('id');
        $completedToday = Ticket::query()->where('technician_id', $user->id)->whereDate('updated_at', now()->toDateString())->whereIn('status', ['COMPLETED', 'CLOSED', 'CLOSED_WITH_LOSS'])->count();
        $activeTickets = Ticket::query()->where('technician_id', $user->id)->whereIn('status', ['ASSIGNED', 'MATERIAL_PREPARED', 'IN_PROGRESS', 'ESCALATED', 'PENDING_MANAGER_REVIEW'])->count();
        $escalations = $this->safeScalar('app_state.technician_escalations', fn () => Escalation::query()->whereHas('ticket', fn ($query) => $query->where('technician_id', $user->id))->count(), 0, [
            'technician_id' => $user->id,
        ]);

        return [
            'id' => (string) $user->id,
            'name' => $user->name,
            'area' => $user->area?->name ?? 'Tanpa Area',
            'leaderId' => $leaderId ? (string) $leaderId : '',
            'completedToday' => $completedToday,
            'averageRepairHours' => 0,
            'escalationCount' => $escalations,
            'bonusEligibleJobs' => $completedToday,
            'status' => $activeTickets > 0 ? 'AKTIF' : 'SIAGA',
            'jobStats' => [
                'installODP' => 0,
                'repairFiber' => 0,
                'replaceConnector' => 0,
                'installONT' => 0,
                'maintenance' => 0,
            ],
        ];
    }

    protected function stringifyState(?array $state): string
    {
        if (!$state) {
            return '-';
        }

        return collect($state)->map(fn ($value, $key) => $key.': '.(is_scalar($value) ? $value : json_encode($value)))->implode(', ');
    }

    protected function safeEscalations(): array
    {
        try {
            if (!Schema::hasTable('escalations')) {
                return [];
            }

            return Escalation::query()
                ->with(['ticket', 'creator'])
                ->latest()
                ->get()
                ->map(function (Escalation $escalation) {
                    return [
                        'id' => (string) $escalation->id,
                        'ticket_id' => (string) $escalation->ticket_id,
                        'type' => $escalation->type ?? $escalation->reason ?? null,
                        'description' => $escalation->description ?? $escalation->note ?? null,
                        'status' => $escalation->status ?? 'pending',
                        'severity' => $escalation->severity ?? null,
                        'created_at' => $escalation->created_at?->toIso8601String(),
                    ];
                })
                ->values()
                ->all();
        } catch (\Exception $exception) {
            Log::error('Escalation error: '.$exception->getMessage());

            return [];
        }
    }

    protected function safeCollection(string $key, callable $callback)
    {
        try {
            return $callback();
        } catch (\Throwable $exception) {
            Log::error($key, ['error' => $exception->getMessage()]);

            return collect();
        }
    }

    protected function safeScalar(string $key, callable $callback, mixed $fallback, array $context = []): mixed
    {
        try {
            return $callback();
        } catch (\Throwable $exception) {
            Log::error($key, array_merge($context, ['error' => $exception->getMessage()]));

            return $fallback;
        }
    }
}
