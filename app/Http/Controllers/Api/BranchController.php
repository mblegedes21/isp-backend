<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BranchController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Branch::query()
                ->select(['id', 'name', 'code'])
                ->where('is_active', true)
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'max:30', 'unique:branches,code'],
        ]);

        return response()->json(['success' => true, 'data' => Branch::query()->create($data)], 201);
    }

    public function update(Request $request, Branch $branch): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'code' => ['sometimes', 'string', 'max:30', Rule::unique('branches', 'code')->ignore($branch->id)],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $branch->update($data);

        return response()->json(['success' => true, 'data' => $branch->fresh()]);
    }

    public function destroy(Branch $branch): JsonResponse
    {
        $branch->update(['is_active' => false]);

        return response()->json(['success' => true, 'data' => $branch->fresh()]);
    }
}
