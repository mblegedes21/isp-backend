<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;

class ApiActorResolver
{
    public function resolve(Request $request, ?int $fallbackUserId = null): User
    {
        if ($request->user()) {
            return $request->user();
        }

        $userId = $request->header('X-User-Id')
            ?? $request->input('acting_user_id')
            ?? $request->input('user_id')
            ?? $fallbackUserId;

        abort_if(!$userId, 422, 'Aktor pengguna tidak tersedia.');

        return User::query()->findOrFail((int) $userId);
    }

    public function ensureRole(User $user, array $allowedRoles): void
    {
        $currentRole = $this->normalizeRole($user->role);
        $normalizedAllowedRoles = array_map(fn (string $role) => $this->normalizeRole($role), $allowedRoles);

        abort_unless(in_array($currentRole, $normalizedAllowedRoles, true), 403, 'Peran pengguna tidak diizinkan untuk aksi ini.');
    }

    private function normalizeRole(?string $role): string
    {
        return User::databaseRole((string) $role);
    }
}
