<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\OptimizeTicketMaterialReportPhoto;
use App\Models\Ticket;
use App\Models\TicketMaterial;
use App\Models\TicketMaterialReport;
use App\Services\ApiActorResolver;
use App\Services\AuditLogger;
use App\Services\GeoValidationService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TicketMaterialReportController extends Controller
{
    public function assignedMaterials(Request $request)
    {
        try {
            $actor = $request->user();
            abort_unless($actor && $actor->isTechnician(), 403, 'Hanya teknisi yang dapat mengakses material tugas.');

            $request->validate([
                'ticket_id' => ['nullable'],
            ]);

            $ticket = null;
            if ($request->filled('ticket_id')) {
                $ticketId = $request->string('ticket_id');
                $ticket = Ticket::query()
                    ->where('nomor_ticket', $ticketId)
                    ->orWhere('id', $ticketId)
                    ->firstOrFail();

                $assignedTechnicianIds = $ticket->technicians()->pluck('id')->push($ticket->technician_id)->filter()->map(fn ($id) => (int) $id);
                abort_unless($assignedTechnicianIds->contains((int) $actor->id), 403, 'Tiket ini bukan milik teknisi aktif.');
            }

            $materials = $this->buildAssignedMaterials($actor->id, $ticket?->id);

            Log::info('technician.assigned_materials.loaded', [
                'teknisi_id' => $actor->id,
                'ticket_id' => $ticket?->id,
                'rows' => $materials->count(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Material teknisi berhasil dimuat.',
                'data' => $materials->values(),
            ]);
        } catch (\Throwable $exception) {
            Log::error('technician.assigned_materials.failed', [
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

    public function store(
        Request $request,
        ApiActorResolver $actorResolver,
        AuditLogger $auditLogger,
        GeoValidationService $geoValidation
    )
    {
        $actor = $actorResolver->resolve($request);
        $actorResolver->ensureRole($actor, ['TEKNISI', 'LEADER', 'ADMIN_GUDANG', 'MANAGER']);

        $data = $request->validate([
            'ticket_id' => ['required'],
            'teknisi_id' => ['nullable', 'exists:users,id'],
            'technician_id' => ['nullable', 'exists:users,id'],
            'materials' => ['required', 'array', 'min:1'],
            'materials.*.material_id' => ['required', 'exists:materials,id'],
            'materials.*.used' => ['required', 'integer', 'min:0'],
            'materials.*.remaining' => ['required', 'integer', 'min:0'],
            'materials.*.existing_photo_path' => ['nullable', 'string'],
            'materials.*.photo' => ['nullable', 'file', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'device_timestamp' => ['nullable', 'date'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'accuracy' => ['nullable', 'numeric'],
        ]);

        $ticket = Ticket::query()->where('nomor_ticket', $data['ticket_id'])->orWhere('id', $data['ticket_id'])->firstOrFail();
        $technicianId = (int) ($data['teknisi_id'] ?? $data['technician_id'] ?? $actor->id);
        $assignedTechnicianIds = $ticket->technicians()->pluck('id')->push($ticket->technician_id)->filter()->map(fn ($id) => (int) $id);
        abort_unless($assignedTechnicianIds->contains($technicianId), 403, 'Tiket ini bukan milik teknisi aktif.');

        $assignedMaterials = $this->buildAssignedMaterials($technicianId, $ticket->id)->keyBy('material_id');
        $geo = null;

        if (
            array_key_exists('latitude', $data) &&
            array_key_exists('longitude', $data) &&
            $data['latitude'] !== null &&
            $data['longitude'] !== null
        ) {
            $geo = $geoValidation->evaluate(
                ticket: $ticket,
                user: $actor,
                latitude: (float) $data['latitude'],
                longitude: (float) $data['longitude'],
                accuracy: isset($data['accuracy']) ? (float) $data['accuracy'] : null,
                progressType: 'SELESAI',
                sourceType: 'material_report_photo',
            );
        }

        $reports = DB::transaction(function () use ($request, $data, $ticket, $technicianId, $assignedMaterials) {
            return collect($data['materials'])->map(function (array $row, int $index) use ($request, $ticket, $technicianId, $assignedMaterials) {
                $materialId = (int) $row['material_id'];
                $assigned = $assignedMaterials->get($materialId);
                abort_if(!$assigned, 422, 'Material yang dilaporkan tidak termasuk material tugas teknisi.');

                $used = (int) $row['used'];
                $remaining = (int) $row['remaining'];
                $assignedQuantity = (int) ($assigned['quantity_assigned'] ?? 0);

                abort_if($used + $remaining > $assignedQuantity, 422, 'Jumlah material dipakai dan sisa melebihi material yang ditugaskan.');

                $file = $request->file("materials.{$index}.photo");
                $existingPhotoPath = $row['existing_photo_path'] ?? null;
                abort_if(!$file && blank($existingPhotoPath), 422, 'Foto bukti material wajib diunggah untuk setiap material.');

                $tempPath = null;
                $photoPath = $existingPhotoPath;
                $status = $file ? 'PENDING' : 'READY';

                if ($file) {
                    $tempPath = $file->storeAs(
                        'tmp/material-report-photos',
                        Str::random(40).'.'.$file->getClientOriginalExtension(),
                        config('operations.evidence.temporary_disk', 'local')
                    );
                    $photoPath = null;
                }

                return TicketMaterialReport::query()->updateOrCreate(
                    [
                        'ticket_id' => $ticket->id,
                        'technician_id' => $technicianId,
                        'material_id' => $materialId,
                    ],
                    [
                        'branch_id' => $ticket->branch_id,
                        'area_id' => $ticket->area_id,
                        'material_used' => sprintf('%s %s', $used, $assigned['material_name']),
                        'material_remaining' => sprintf('%s %s', $remaining, $assigned['material_name']),
                        'quantity_used' => $used,
                        'quantity_remaining' => $remaining,
                        'photo_path' => $photoPath,
                        'photo_temp_path' => $tempPath,
                        'remaining_photo_path' => $photoPath,
                        'remaining_photo_temp_path' => $tempPath,
                        'latitude' => $data['latitude'] ?? null,
                        'longitude' => $data['longitude'] ?? null,
                        'accuracy' => $data['accuracy'] ?? null,
                        'captured_at_server' => now(),
                        'uploaded_at_server' => now(),
                        'status' => $status,
                    ]
                );
            });
        });

        $reports->each(function (TicketMaterialReport $report) {
            if ($report->photo_temp_path) {
                OptimizeTicketMaterialReportPhoto::dispatch($report->id);
            }
        });

        $reports = $reports->load(['ticket:id,nomor_ticket', 'material:id,name,brand,unit']);

        $auditLogger->write(
            action: 'ticket.material_report.submitted',
            module: 'stock',
            entityType: TicketMaterialReport::class,
            entityId: $ticket->id,
            afterState: [
                'technician_id' => $technicianId,
                'materials' => $reports->map(function (TicketMaterialReport $report) use ($geo) {
                    return [
                        'material_id' => $report->material_id,
                        'used' => $report->quantity_used,
                        'remaining' => $report->quantity_remaining,
                        'status' => $report->status,
                        'location_status' => $geo['location_status'] ?? null,
                        'risk_score' => $geo['risk_score'] ?? null,
                    ];
                })->values(),
            ],
            userId: $actor->id,
            branchId: $ticket->branch_id,
            areaId: $ticket->area_id,
            request: $request,
        );

        return response()->json([
            'success' => true,
            'message' => 'Laporan material teknisi berhasil disimpan.',
            'data' => $reports->map(fn (TicketMaterialReport $report) => $this->serializeReport($report))->values(),
        ]);
    }

    private function buildAssignedMaterials(int $technicianId, ?int $ticketId = null): Collection
    {
        $assignments = TicketMaterial::query()
            ->with(['material:id,name,brand,unit,stock', 'ticket:id,nomor_ticket'])
            ->where(function ($query) use ($technicianId) {
                $query->where('teknisi_id', $technicianId)
                    ->orWhere('technician_id', $technicianId);
            })
            ->where('source_type', 'LEADER_ASSIGNMENT')
            ->when($ticketId, fn ($query) => $query->where('ticket_id', $ticketId))
            ->get();

        $reported = TicketMaterialReport::query()
            ->when($ticketId, fn ($query) => $query->where('ticket_id', $ticketId))
            ->where('technician_id', $technicianId)
            ->get()
            ->keyBy(fn (TicketMaterialReport $report) => sprintf('%s:%s', $report->ticket_id, $report->material_id));

        return $assignments->map(function (TicketMaterial $assignment) use ($reported) {
            $assigned = (int) ($assignment->quantity ?: $assignment->qty);

            if ($assigned <= 0) {
                return null;
            }

            $report = $reported->get(sprintf('%s:%s', $assignment->ticket_id, $assignment->material_id));

            return [
                'ticket_id' => (int) $assignment->ticket_id,
                'ticket_number' => (string) ($assignment->ticket?->nomor_ticket ?: $assignment->ticket_id),
                'teknisi_id' => (int) ($assignment->teknisi_id ?: $assignment->technician_id),
                'material_id' => (int) ($assignment->material_id ?: $assignment->product_id),
                'material_name' => trim(collect([$assignment->material?->brand, $assignment->material?->name])->filter()->implode(' ')),
                'unit' => $assignment->material?->unit,
                'quantity' => $assigned,
                'quantity_assigned' => $assigned,
                'current_stock' => (int) ($assignment->material?->stock ?? $assignment->material?->current_stock ?? 0),
                'reported_used' => (int) ($report?->quantity_used ?? 0),
                'reported_remaining' => (int) ($report?->quantity_remaining ?? 0),
                'photo_path' => $report?->photo_path,
            ];
        })->filter()->values();
    }

    private function serializeReport(TicketMaterialReport $report): array
    {
        return [
            'id' => (string) $report->id,
            'ticket_id' => (string) ($report->ticket?->nomor_ticket ?: $report->ticket_id),
            'teknisi_id' => (string) $report->technician_id,
            'material_id' => (string) $report->material_id,
            'material_name' => trim(collect([$report->material?->brand, $report->material?->name])->filter()->implode(' ')),
            'unit' => $report->material?->unit,
            'used' => (int) ($report->quantity_used ?? 0),
            'remaining' => (int) ($report->quantity_remaining ?? 0),
            'photo_path' => $report->photo_path,
            'latitude' => $report->latitude ? (float) $report->latitude : null,
            'longitude' => $report->longitude ? (float) $report->longitude : null,
            'accuracy' => $report->accuracy ? (float) $report->accuracy : null,
            'status' => $report->status,
            'captured_at_server' => $report->captured_at_server?->toIso8601String(),
            'created_at' => $report->created_at?->toIso8601String(),
        ];
    }
}
