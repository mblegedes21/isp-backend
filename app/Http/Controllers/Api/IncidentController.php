<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Models\User;
use App\Services\ApiActorResolver;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class IncidentController extends Controller
{
    public function respond(Request $request, Incident $incident, ApiActorResolver $actorResolver, AuditLogger $auditLogger)
    {
        $actor = $actorResolver->resolve($request);
        $actorResolver->ensureRole($actor, [User::ROLE_MANAGER]);

        $data = $request->validate([
            'action' => ['required', 'string'],
        ]);

        $responseStatus = match ($data['action']) {
            'Deklarasikan Insiden' => 'DALAM_RESPON',
            'Notifikasi Semua Teknisi' => 'DIKOMUNIKASIKAN',
            default => 'DALAM_RESPON',
        };

        $before = $incident->toArray();
        $incident->update(['response_status' => $responseStatus]);

        $auditLogger->write(
            action: 'incident.responded',
            module: 'monitoring',
            entityType: Incident::class,
            entityId: $incident->id,
            beforeState: $before,
            afterState: $incident->fresh()->toArray(),
            userId: $actor->id,
            branchId: $incident->branch_id,
            areaId: $incident->area_id,
            request: $request,
        );

        return response()->json(['ok' => true]);
    }
}
