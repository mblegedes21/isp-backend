<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\AreaAction;
use App\Models\User;
use App\Services\ApiActorResolver;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class AreaActionController extends Controller
{
    public function store(Request $request, ApiActorResolver $actorResolver, AuditLogger $auditLogger)
    {
        $actor = $actorResolver->resolve($request);
        $actorResolver->ensureRole($actor, [User::ROLE_MANAGER]);

        $data = $request->validate([
            'area_name' => ['required', 'string', 'max:120'],
            'action' => ['required', 'string', 'max:160'],
        ]);

        $area = Area::query()->where('name', $data['area_name'])->first();
        $record = AreaAction::create([
            'branch_id' => $area?->branch_id,
            'area_id' => $area?->id,
            'area_name' => $data['area_name'],
            'action' => $data['action'],
            'created_by' => $actor->id,
        ]);

        $auditLogger->write(
            action: 'area.action.recorded',
            module: 'monitoring',
            entityType: AreaAction::class,
            entityId: $record->id,
            afterState: $record->toArray(),
            userId: $actor->id,
            branchId: $record->branch_id,
            areaId: $record->area_id,
            request: $request,
        );

        return response()->json(['ok' => true, 'data' => $record], 201);
    }
}
