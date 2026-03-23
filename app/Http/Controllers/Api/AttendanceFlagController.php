<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceFlag;
use App\Models\User;
use App\Services\ApiActorResolver;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class AttendanceFlagController extends Controller
{
    public function updateStatus(Request $request, string $attendanceFlag, ApiActorResolver $actorResolver, AuditLogger $auditLogger)
    {
        $actor = $actorResolver->resolve($request);
        $actorResolver->ensureRole($actor, [User::ROLE_MANAGER, User::ROLE_LEADER]);

        $data = $request->validate([
            'status' => ['required', 'in:BELUM_DITINJAU,MENUNGGU_PENJELASAN,PERINGATAN_TERKIRIM,LEADER_DINOTIFIKASI,SELESAI'],
        ]);

        $flag = AttendanceFlag::query()
            ->whereKey($attendanceFlag)
            ->orWhere('attendance_id', $attendanceFlag)
            ->latest()
            ->firstOrFail();

        $before = $flag->toArray();
        $flag->update(['status' => $data['status']]);

        $auditLogger->write(
            action: 'attendance.flag.reviewed',
            module: 'attendance',
            entityType: AttendanceFlag::class,
            entityId: $flag->id,
            beforeState: $before,
            afterState: $flag->fresh()->toArray(),
            userId: $actor->id,
            branchId: $flag->branch_id,
            areaId: $flag->area_id,
            request: $request,
        );

        return response()->json(['ok' => true]);
    }
}
