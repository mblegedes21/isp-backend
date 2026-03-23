<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MaterialCategory;
use Illuminate\Http\JsonResponse;

class MaterialCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Material categories fetched',
            'data' => MaterialCategory::query()
                ->orderBy('name')
                ->get(['id', 'name', 'description']),
        ]);
    }
}
