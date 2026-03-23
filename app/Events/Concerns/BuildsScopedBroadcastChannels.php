<?php

namespace App\Events\Concerns;

use App\Models\User;
use Illuminate\Broadcasting\PrivateChannel;

trait BuildsScopedBroadcastChannels
{
    protected function scopedChannels(?int $branchId = null, ?int $areaId = null, array $roles = []): array
    {
        $channels = [];

        if ($branchId) {
            $channels[] = new PrivateChannel("branch.{$branchId}");
        }

        if ($areaId) {
            $channels[] = new PrivateChannel("area.{$areaId}");
        }

        foreach ($roles as $role) {
            $channels[] = new PrivateChannel('role.'.$this->normalizeRoleChannel($role));
        }

        return $channels;
    }

    private function normalizeRoleChannel(string $role): string
    {
        return match (User::databaseRole($role)) {
            User::ROLE_MANAGER => 'manager',
            User::ROLE_LEADER => 'leader',
            User::ROLE_TEKNISI => 'technician',
            User::ROLE_ADMIN_GUDANG => 'warehouse',
            User::ROLE_NOC => 'noc',
            User::ROLE_MITRA => 'mitra',
            default => strtolower($role),
        };
    }
}
