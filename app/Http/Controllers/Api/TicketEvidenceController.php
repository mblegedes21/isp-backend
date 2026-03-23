<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEvidenceImageRequest;
use App\Jobs\OptimizeEvidenceImage;
use App\Models\Ticket;
use App\Models\TicketImage;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TicketEvidenceController extends Controller
{
    public function store(StoreEvidenceImageRequest $request, Ticket $ticket)
    {
        $file = $request->file('image');
        $tempPath = $file->storeAs(
            'tmp/evidence',
            Str::random(40).'.'.$file->getClientOriginalExtension(),
            config('operations.evidence.temporary_disk', 'local')
        );

        $image = TicketImage::create([
            'ticket_id' => $ticket->id,
            'branch_id' => $ticket->branch_id,
            'area_id' => $ticket->area_id,
            'uploaded_by' => $request->integer('uploaded_by') ?: $request->user()?->id,
            'temp_path' => $tempPath,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'status' => 'PENDING',
        ]);

        OptimizeEvidenceImage::dispatch($image->id);

        return response()->json([
            'message' => 'Evidence upload queued for optimization.',
            'data' => $image,
        ], 202);
    }
}
