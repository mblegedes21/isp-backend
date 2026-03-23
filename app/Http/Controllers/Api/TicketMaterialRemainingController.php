<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTicketMaterialRemainingRequest;
use App\Jobs\OptimizeMaterialRemainingPhoto;
use App\Models\Ticket;
use App\Models\TicketMaterialRemaining;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\GeoValidationService;
use Illuminate\Support\Str;

class TicketMaterialRemainingController extends Controller
{
    public function store(
        StoreTicketMaterialRemainingRequest $request,
        GeoValidationService $geoValidation,
        AuditLogger $auditLogger
    ) {
        $data = $request->validated();
        $ticket = Ticket::query()->findOrFail($data['ticket_id']);
        $technician = User::query()->findOrFail($data['technician_id'] ?? $request->user()?->id);
        $file = $request->file('image');
        $tempPath = $file->storeAs(
            'tmp/material-remaining',
            Str::random(40).'.'.$file->getClientOriginalExtension(),
            config('operations.evidence.temporary_disk', 'local')
        );

        $geo = $geoValidation->evaluate(
            ticket: $ticket,
            user: $technician,
            latitude: (float) $data['latitude'],
            longitude: (float) $data['longitude'],
            accuracy: (float) $data['accuracy'],
            progressType: 'SELESAI',
            sourceType: 'material_remaining',
        );

        $evidence = TicketMaterialRemaining::create([
            'ticket_id' => $ticket->id,
            'material_id' => $data['material_id'],
            'technician_id' => $technician->id,
            'branch_id' => $ticket->branch_id,
            'area_id' => $ticket->area_id,
            'quantity_remaining' => $data['quantity_remaining'],
            'temp_path' => $tempPath,
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'accuracy' => $data['accuracy'],
            'calculated_distance_meter' => $geo['calculated_distance_meter'],
            'location_status' => $geo['location_status'],
            'needs_review' => $geo['location_status'] === 'suspicious',
            'risk_score' => $geo['risk_score'],
            'risk_reasons' => $geo['risk_reasons'],
            'captured_at_server' => now(),
            'uploaded_at_server' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 65535),
            'mime_type' => $file->getClientMimeType(),
            'status' => 'PENDING',
        ]);

        OptimizeMaterialRemainingPhoto::dispatch($evidence->id);

        $auditLogger->write(
            action: 'ticket.material_remaining.submitted',
            module: 'ticket_progress',
            entityType: TicketMaterialRemaining::class,
            entityId: $evidence->id,
            afterState: [
                'material_id' => $evidence->material_id,
                'quantity_remaining' => $evidence->quantity_remaining,
                'location_status' => $evidence->location_status,
                'risk_score' => $evidence->risk_score,
            ],
            userId: $technician->id,
            branchId: $evidence->branch_id,
            areaId: $evidence->area_id,
            request: $request,
        );

        return response()->json([
            'data' => $evidence,
            'radius_validation_result' => $geo['radius_validation_result'],
        ], 202);
    }
}
