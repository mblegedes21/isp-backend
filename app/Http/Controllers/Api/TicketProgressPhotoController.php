<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProgressPhotoRequest;
use App\Jobs\OptimizeProgressPhoto;
use App\Models\Ticket;
use App\Models\TicketProgressPhoto;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\GeoValidationService;
use Illuminate\Support\Str;

class TicketProgressPhotoController extends Controller
{
    public function store(
        StoreProgressPhotoRequest $request,
        GeoValidationService $geoValidation,
        AuditLogger $auditLogger
    ) {
        $data = $request->validated();
        $ticket = Ticket::query()->findOrFail($data['ticket_id']);
        $user = User::query()->findOrFail($data['user_id'] ?? $request->user()?->id);
        $file = $request->file('image');
        $tempPath = $file->storeAs(
            'tmp/progress-photos',
            Str::random(40).'.'.$file->getClientOriginalExtension(),
            config('operations.evidence.temporary_disk', 'local')
        );

        $geo = $geoValidation->evaluate(
            ticket: $ticket,
            user: $user,
            latitude: (float) ($data['latitude'] ?? $ticket->ticket_latitude ?? 0),
            longitude: (float) ($data['longitude'] ?? $ticket->ticket_longitude ?? 0),
            accuracy: isset($data['accuracy']) ? (float) $data['accuracy'] : null,
            progressType: $data['progress_type'],
            sourceType: 'progress_photo',
        );

        $photo = TicketProgressPhoto::updateOrCreate(
            [
                'ticket_id' => $ticket->id,
                'user_id' => $user->id,
                'progress_type' => $data['progress_type'],
            ],
            [
                'branch_id' => $ticket->branch_id,
                'area_id' => $ticket->area_id,
                'temp_path' => $tempPath,
                'latitude' => $data['latitude'] ?? null,
                'longitude' => $data['longitude'] ?? null,
                'accuracy' => $data['accuracy'] ?? null,
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
            ]
        );

        OptimizeProgressPhoto::dispatch($photo->id);

        $auditLogger->write(
            action: 'ticket.progress.photo.submitted',
            module: 'ticket_progress',
            entityType: TicketProgressPhoto::class,
            entityId: $photo->id,
            afterState: [
                'progress_type' => $photo->progress_type,
                'location_status' => $photo->location_status,
                'risk_score' => $photo->risk_score,
            ],
            userId: $user->id,
            branchId: $photo->branch_id,
            areaId: $photo->area_id,
            request: $request,
        );

        return response()->json([
            'data' => $photo,
            'radius_validation_result' => $geo['radius_validation_result'],
        ], 202);
    }
}
