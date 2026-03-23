<?php

namespace App\Jobs;

use App\Models\TicketMaterialReport;
use App\Services\EvidenceImageOptimizer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use Throwable;

class OptimizeTicketMaterialReportPhoto implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $reportId)
    {
        $this->onQueue('evidence');
    }

    public function handle(EvidenceImageOptimizer $optimizer): void
    {
        $report = TicketMaterialReport::query()->find($this->reportId);

        if (!$report || !$report->photo_temp_path) {
            return;
        }

        $payload = $optimizer->optimize(
            $report->photo_temp_path,
            sprintf('%s/%s/material-report/%s', $report->branch_id ?? 'shared', $report->ticket_id, $report->material_id ?? 'material')
        );

        $report->update([
            'photo_path' => $payload['path'],
            'photo_temp_path' => null,
            'status' => 'READY',
        ]);
    }

    public function failed(Throwable $exception): void
    {
        $report = TicketMaterialReport::query()->find($this->reportId);

        if ($report?->photo_temp_path) {
            Storage::disk(config('operations.evidence.temporary_disk', 'local'))->delete($report->photo_temp_path);
        }

        TicketMaterialReport::query()->whereKey($this->reportId)->update([
            'status' => 'FAILED',
            'photo_temp_path' => null,
        ]);
    }
}
