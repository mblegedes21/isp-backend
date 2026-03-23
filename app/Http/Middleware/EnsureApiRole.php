<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureApiRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        abort_unless($user, 401, 'Unauthenticated.');
        $currentRole = $this->normalizeRole($user->role);
        $allowedRoles = array_map(fn (string $role) => $this->normalizeRole($role), $roles);

        abort_unless(in_array($currentRole, $allowedRoles, true), 403, 'Peran pengguna tidak diizinkan untuk route ini.');

        return $next($request);
    }

    private function normalizeRole(?string $role): string
    {
        return User::databaseRole((string) $role);
    }
}
