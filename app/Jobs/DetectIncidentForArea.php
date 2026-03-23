<?php

namespace App\Jobs;

use App\Services\IncidentDetectionService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class DetectIncidentForArea implements ShouldQueue
{
    use Queueable;

    public function __construct(public ?int $branchId, public ?int $areaId)
    {
        $this->onQueue('stats');
    }

    public function handle(IncidentDetectionService $service): void
    {
        $service->detectForArea($this->branchId, $this->areaId);
    }
}
