<?php

namespace App\Services;

use App\Events\IncidentDetected;
use App\Models\Escalation;
use App\Models\Ticket;

class IncidentDetectionService
{
    public function detectForArea(?int $branchId, ?int $areaId): void
    {
        if (!$branchId || !$areaId) {
            return;
        }

        $lookbackMinutes = (int) config('operations.incident_detection.lookback_minutes', 30);
        $ticketThreshold = (int) config('operations.incident_detection.ticket_threshold', 6);
        $escalationThreshold = (int) config('operations.incident_detection.escalation_threshold', 3);
        $since = now()->subMinutes($lookbackMinutes);

        $ticketCount = Ticket::query()
            ->where('branch_id', $branchId)
            ->where('area_id', $areaId)
            ->where('created_at', '>=', $since)
            ->count();

        $escalationCount = Escalation::query()
            ->where('branch_id', $branchId)
            ->where('area_id', $areaId)
            ->where('created_at', '>=', $since)
            ->count();

        if ($ticketCount >= $ticketThreshold || $escalationCount >= $escalationThreshold) {
            IncidentDetected::dispatch($branchId, $areaId, $ticketCount, $escalationCount);
        }
    }
}
