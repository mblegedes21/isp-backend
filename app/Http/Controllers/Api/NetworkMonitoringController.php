<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\Incident;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;

class NetworkMonitoringController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $activeNodes = Area::query()->where('is_active', true)->count();
        $downNodes = Incident::query()
            ->whereIn('response_status', ['BARU', 'DALAM_RESPON'])
            ->distinct('area_id')
            ->count('area_id');
        $alerts = Incident::query()
            ->with('area:id,name')
            ->latest('detected_at')
            ->limit(5)
            ->get()
            ->map(function (Incident $incident) {
                return [
                    'id' => (string) $incident->id,
                    'area' => $incident->area?->name ?? 'Tanpa Area',
                    'severity' => $incident->severity,
                    'ticket_count' => (int) $incident->ticket_count,
                    'escalation_count' => (int) $incident->escalation_count,
                    'status' => $incident->response_status,
                    'detected_at' => $incident->detected_at?->toIso8601String(),
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'message' => 'Network monitoring loaded.',
            'data' => [
                'status' => $downNodes > 0 ? 'degraded' : 'online',
                'active_nodes' => $activeNodes,
                'down_nodes' => $downNodes,
                'alerts' => $alerts,
                'open_tickets' => Ticket::query()->whereIn('status', ['CREATED', 'ASSIGNED', 'MATERIAL_PREPARED', 'IN_PROGRESS', 'ESCALATED'])->count(),
            ],
        ]);
    }
}
