<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogger
{
    public function write(
        string $action,
        string $module,
        string $entityType,
        string|int $entityId,
        array $beforeState = [],
        array $afterState = [],
        ?int $userId = null,
        ?int $branchId = null,
        ?int $areaId = null,
        ?Request $request = null,
        ?string $source = null,
    ): AuditLog {
        return AuditLog::create([
            'user_id' => $userId,
            'action' => $action,
            'module' => $module,
            'entity_type' => $entityType,
            'entity_id' => (string) $entityId,
            'before_state' => $beforeState ?: null,
            'after_state' => $afterState ?: null,
            'branch_id' => $branchId,
            'area_id' => $areaId,
            'ip_address' => $request?->ip(),
            'source' => $source,
        ]);
    }
}
