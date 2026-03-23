<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ManagerDashboardCacheService;

class ManagerDashboardController extends Controller
{
    public function __invoke(ManagerDashboardCacheService $cacheService)
    {
        return response()->json($cacheService->summary());
    }
}
