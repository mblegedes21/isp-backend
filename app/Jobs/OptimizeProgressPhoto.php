<?php

namespace App\Jobs;

use App\Models\TicketProgressPhoto;
use App\Services\EvidenceImageOptimizer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use Throwable;

class OptimizeProgressPhoto implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $photoId)
    {
        $this->onQueue('evidence');
    }

    public function handle(EvidenceImageOptimizer $optimizer): void
    {
        $photo = TicketProgressPhoto::query()->find($this->photoId);

        if (!$photo || !$photo->temp_path) {
            return;
        }

        $payload = $optimizer->optimize(
            $photo->temp_path,
            sprintf('%s/%s', $photo->branch_id ?? 'shared', $photo->ticket_id)
        );

        $photo->update([
            'image_path' => $payload['path'],
            'image_size_kb' => round($payload['size_bytes'] / 1024, 2),
            'mime_type' => $payload['mime_type'],
            'temp_path' => null,
            'status' => 'READY',
        ]);
    }

    public function failed(Throwable $exception): void
    {
        $photo = TicketProgressPhoto::query()->find($this->photoId);

        if ($photo?->temp_path) {
            Storage::disk(config('operations.evidence.temporary_disk', 'local'))->delete($photo->temp_path);
        }

        TicketProgressPhoto::query()->whereKey($this->photoId)->update([
            'status' => 'FAILED',
            'temp_path' => null,
        ]);
    }
}
