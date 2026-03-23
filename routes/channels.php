<?php

use App\Models\User;
use App\Models\Area;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('branch.{branchId}', function ($user, int $branchId) {
    return $user->isManager() || (int) $user->branch_id === $branchId;
});

Broadcast::channel('area.{areaId}', function ($user, int $areaId) {
    if ($user->isManager()) {
        return true;
    }

    $area = Area::query()->select('id', 'branch_id')->find($areaId);

    return $area && (int) $user->branch_id === (int) $area->branch_id;
});

Broadcast::channel('role.manager', fn ($user) => $user->role === User::ROLE_MANAGER);
Broadcast::channel('role.leader', fn ($user) => in_array($user->role, [User::ROLE_LEADER, User::ROLE_MANAGER], true));
Broadcast::channel('role.technician', fn ($user) => in_array($user->role, [User::ROLE_TEKNISI, User::ROLE_LEADER, User::ROLE_MANAGER], true));
