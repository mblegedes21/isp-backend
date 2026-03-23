<?php

namespace App\Jobs;

use App\Models\TicketMaterialRemaining;
use App\Services\EvidenceImageOptimizer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use Throwable;

class OptimizeMaterialRemainingPhoto implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $evidenceId)
    {
        $this->onQueue('evidence');
    }

    public function handle(EvidenceImageOptimizer $optimizer): void
    {
        $evidence = TicketMaterialRemaining::query()->find($this->evidenceId);

        if (!$evidence || !$evidence->temp_path) {
            return;
        }

        $payload = $optimizer->optimize(
            $evidence->temp_path,
            sprintf('%s/%s/material-remaining', $evidence->branch_id ?? 'shared', $evidence->ticket_id)
        );

        $evidence->update([
            'photo_path' => $payload['path'],
            'image_size_kb' => round($payload['size_bytes'] / 1024, 2),
            'mime_type' => $payload['mime_type'],
            'temp_path' => null,
            'status' => 'READY',
        ]);
    }

    public function failed(Throwable $exception): void
    {
        $evidence = TicketMaterialRemaining::query()->find($this->evidenceId);

        if ($evidence?->temp_path) {
            Storage::disk(config('operations.evidence.temporary_disk', 'local'))->delete($evidence->temp_path);
        }

        TicketMaterialRemaining::query()->whereKey($this->evidenceId)->update([
            'status' => 'FAILED',
            'temp_path' => null,
        ]);
    }
}
