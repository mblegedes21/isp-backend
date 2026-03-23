<?php

namespace App\Jobs;

use App\Models\AuditLog;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class DeleteAuditLogs implements ShouldQueue
{
    use Queueable;

    public function __construct()
    {
        $this->onQueue('maintenance');
    }

    public function handle(): void
    {
        AuditLog::query()
            ->where('created_at', '<', now()->subDays((int) config('operations.audit_retention_days', 90)))
            ->delete();
    }
}
