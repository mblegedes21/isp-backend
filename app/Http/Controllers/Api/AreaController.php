<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Area;
use Illuminate\Http\Request;

class AreaController extends Controller
{
    public function index(Request $request)
    {
        $query = Area::query()->orderBy('name');

        if ($request->has('is_active')) {
            $query->where('is_active', (bool) $request->boolean('is_active'));
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'branch_id' => ['nullable', 'exists:branches,id'],
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'max:30', 'unique:areas,code'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $area = Area::create($data);

        return response()->json($area, 201);
    }

    public function show(Area $area)
    {
        return response()->json($area);
    }

    public function update(Request $request, Area $area)
    {
        $data = $request->validate([
            'branch_id' => ['nullable', 'exists:branches,id'],
            'name' => ['sometimes', 'string', 'max:120'],
            'code' => ['sometimes', 'string', 'max:30', 'unique:areas,code,' . $area->id],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $area->update($data);

        return response()->json($area->fresh());
    }

    public function destroy(Area $area)
    {
        $area->update(['is_active' => false]);

        return response()->json([
            'message' => 'Area deactivated',
            'data' => $area->fresh(),
        ]);
    }
}
