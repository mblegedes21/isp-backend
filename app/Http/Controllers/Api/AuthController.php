<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    private const ALLOWED_ROLES = User::ROLES;

    public function register(Request $request): JsonResponse
    {
        $request->merge([
            'role' => User::databaseRole((string) $request->input('role')),
        ]);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:120', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['required', 'in:'.implode(',', self::ALLOWED_ROLES)],
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
        ]);

        $branch = Branch::query()->findOrFail($data['branch_id']);
        $area = $this->resolveDefaultArea($branch);

        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => User::databaseRole($data['role']),
            'branch_id' => $branch->id,
            'area_id' => $area->id,
        ]);
        $user->setRelation('branch', $branch);

        $token = $user->createToken('web-dashboard')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->serializeAuthUser($user),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Email atau password salah',
            ], 401);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user()->loadMissing('branch');
        $token = $user->createToken('web-dashboard')->plainTextToken;

        return response()->json([
            'user' => $this->serializeAuthUser($user),
            'message' => 'Login berhasil',
            'token' => $token,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->serializeAuthUser($request->user()->loadMissing('branch')),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logout berhasil.',
        ]);
    }

    private function serializeAuthUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'branch_id' => $user->branch_id,
            'branch_name' => $user->branch?->name,
        ];
    }

    private function resolveDefaultBranch(): Branch
    {
        return Branch::query()->first() ?? Branch::query()->create([
            'name' => 'Cabang Pusat',
            'code' => 'PST',
            'is_active' => true,
        ]);
    }

    private function resolveDefaultArea(Branch $branch): Area
    {
        return Area::query()->where('branch_id', $branch->id)->first() ?? Area::query()->create([
            'branch_id' => $branch->id,
            'name' => 'Area '.$branch->name,
            'code' => 'AR-'.$branch->code,
            'is_active' => true,
        ]);
    }
}
