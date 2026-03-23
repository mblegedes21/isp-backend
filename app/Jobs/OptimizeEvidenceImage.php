<?php

namespace App\Jobs;

use App\Models\TicketImage;
use App\Services\EvidenceImageOptimizer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use Throwable;

class OptimizeEvidenceImage implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $ticketImageId)
    {
        $this->onQueue('evidence');
    }

    public function handle(EvidenceImageOptimizer $optimizer): void
    {
        $ticketImage = TicketImage::query()->find($this->ticketImageId);

        if (!$ticketImage || !$ticketImage->temp_path) {
            return;
        }

        $ticketImage->update(['status' => 'PROCESSING']);

        $payload = $optimizer->optimize(
            $ticketImage->temp_path,
            sprintf('%s/%s', $ticketImage->branch_id ?? 'shared', $ticketImage->ticket_id)
        );

        $ticketImage->update([
            'disk' => $payload['disk'],
            'path' => $payload['path'],
            'mime_type' => $payload['mime_type'],
            'size_bytes' => $payload['size_bytes'],
            'width' => $payload['width'],
            'height' => $payload['height'],
            'temp_path' => null,
            'status' => 'READY',
            'processed_at' => now(),
        ]);
    }

    public function failed(Throwable $exception): void
    {
        $ticketImage = TicketImage::query()->find($this->ticketImageId);

        if ($ticketImage?->temp_path) {
            Storage::disk(config('operations.evidence.temporary_disk', 'local'))->delete($ticketImage->temp_path);
        }

        TicketImage::query()->whereKey($this->ticketImageId)->update([
            'status' => 'FAILED',
            'temp_path' => null,
        ]);
    }
}
