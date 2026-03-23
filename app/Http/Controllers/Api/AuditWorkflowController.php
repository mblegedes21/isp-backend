<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\ApiActorResolver;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class AuditWorkflowController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::query()->with('user:id,name,email')->latest();

        if ($request->filled('review_status')) {
            $query->where('review_status', $request->string('review_status'));
        }

        if ($request->filled('module')) {
            $query->where('module', $request->string('module'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($builder) use ($search) {
                $builder->where('entity_id', 'like', "%{$search}%")
                    ->orWhere('entity_type', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate((int) $request->integer('per_page', 20)));
    }

    public function store(Request $request, ApiActorResolver $actorResolver, AuditLogger $auditLogger)
    {
        $actor = $actorResolver->resolve($request);

        $data = $request->validate([
            'action_type' => ['required', 'string'],
            'entity_type' => ['required', 'string'],
            'entity_id' => ['required', 'string'],
            'before' => ['nullable', 'string'],
            'after' => ['nullable', 'string'],
            'source' => ['nullable', 'string'],
        ]);

        $log = $auditLogger->write(
            action: strtolower($data['action_type']),
            module: 'frontend',
            entityType: $data['entity_type'],
            entityId: $data['entity_id'],
            beforeState: ['value' => $data['before']],
            afterState: ['value' => $data['after']],
            userId: $actor->id,
            branchId: $actor->branch_id,
            areaId: $actor->area_id,
            request: $request,
            source: $data['source'] ?? 'Frontend',
        );

        return response()->json(['ok' => true, 'data' => $log], 201);
    }

    public function updateReview(Request $request, AuditLog $auditLog, ApiActorResolver $actorResolver, AuditLogger $auditLogger)
    {
        $actor = $actorResolver->resolve($request);
        $actorResolver->ensureRole($actor, [User::ROLE_MANAGER]);

        $data = $request->validate([
            'review_status' => ['required', 'in:BARU,DITANDAI,KLARIFIKASI,DIINVESTIGASI,SELESAI'],
        ]);

        $before = $auditLog->toArray();
        $auditLog->update(['review_status' => $data['review_status']]);

        $auditLogger->write(
            action: 'audit.review.updated',
            module: 'audit',
            entityType: AuditLog::class,
            entityId: $auditLog->id,
            beforeState: $before,
            afterState: $auditLog->fresh()->toArray(),
            userId: $actor->id,
            branchId: $auditLog->branch_id,
            areaId: $auditLog->area_id,
            request: $request,
        );

        return response()->json(['ok' => true]);
    }
}
