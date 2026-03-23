<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;

class RecalculateTechnicianPerformanceMetrics implements ShouldQueue
{
    use Queueable;

    public function __construct()
    {
        $this->onQueue('stats');
    }

    public function handle(): void
    {
        Cache::store(config('operations.cache_store', 'redis'))
            ->put('manager:technician-performance:last-run', now()->toIso8601String(), now()->addSeconds((int) config('operations.cache_ttl.technician_stats', 15)));
    }
}
