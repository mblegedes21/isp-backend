<?php

namespace App\Jobs;

use App\Services\ManagerDashboardCacheService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class RecalculateManagerStatistics implements ShouldQueue
{
    use Queueable;

    public function __construct()
    {
        $this->onQueue('stats');
    }

    public function handle(ManagerDashboardCacheService $cacheService): void
    {
        $cacheService->summary();
    }
}
