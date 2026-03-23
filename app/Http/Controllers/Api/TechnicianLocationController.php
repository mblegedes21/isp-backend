<?php

namespace App\Http\Controllers\Api;

use App\Events\TechnicianLocationUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTechnicianLocationRequest;
use App\Models\TechnicianLocationLog;
use App\Models\Ticket;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\GeoValidationService;

class TechnicianLocationController extends Controller
{
    public function store(
        StoreTechnicianLocationRequest $request,
        GeoValidationService $geoValidation,
        AuditLogger $auditLogger
    ) {
        $data = $request->validated();
        $user = User::query()->findOrFail($data['user_id'] ?? $request->user()?->id);
        $ticket = !empty($data['ticket_id']) ? Ticket::query()->find($data['ticket_id']) : null;

        $geo = $ticket
            ? $geoValidation->evaluate(
                ticket: $ticket,
                user: $user,
                latitude: (float) $data['latitude'],
                longitude: (float) $data['longitude'],
                accuracy: isset($data['accuracy']) ? (float) $data['accuracy'] : null,
                sourceType: $data['source_type'],
            )
            : [
                'calculated_distance_meter' => null,
                'radius_validation_result' => 'unknown',
                'location_status' => 'warning',
                'risk_score' => 10,
                'risk_reasons' => ['ticket_location_missing'],
            ];

        $locationLog = TechnicianLocationLog::create([
            'user_id' => $user->id,
            'ticket_id' => $ticket?->id,
            'branch_id' => $ticket?->branch_id ?? $user->branch_id,
            'area_id' => $ticket?->area_id ?? $user->area_id,
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'accuracy' => $data['accuracy'] ?? null,
            'calculated_distance_meter' => $geo['calculated_distance_meter'],
            'location_status' => $geo['location_status'],
            'needs_review' => $geo['location_status'] === 'suspicious',
            'risk_score' => $geo['risk_score'],
            'risk_reasons' => $geo['risk_reasons'],
            'source_type' => $data['source_type'],
        ]);

        $auditLogger->write(
            action: 'technician.location.updated',
            module: 'tracking',
            entityType: TechnicianLocationLog::class,
            entityId: $locationLog->id,
            afterState: $locationLog->toArray(),
            userId: $user->id,
            branchId: $locationLog->branch_id,
            areaId: $locationLog->area_id,
            request: $request,
        );

        TechnicianLocationUpdated::dispatch($locationLog);

        return response()->json([
            'data' => $locationLog,
            'radius_validation_result' => $geo['radius_validation_result'],
        ], 201);
    }
}
