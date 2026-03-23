<?php

namespace App\Services;

use App\Models\TechnicianLocationLog;
use App\Models\Ticket;
use App\Models\User;

class GeoValidationService
{
    public const DEFAULT_RADIUS_BY_PROGRESS = [
        'MENUJU_LOKASI' => 1000,
        'MULAI_PEKERJAAN' => 150,
        'TESTING' => 150,
        'SELESAI' => 200,
    ];

    public function evaluate(
        Ticket $ticket,
        User $user,
        float $latitude,
        float $longitude,
        ?float $accuracy,
        ?string $progressType = null,
        ?string $sourceType = null,
    ): array {
        $distance = null;
        $riskScore = 0;
        $reasons = [];
        $status = 'valid';
        $radius = $progressType ? (self::DEFAULT_RADIUS_BY_PROGRESS[$progressType] ?? 150) : ($ticket->valid_radius_meter ?? 150);

        if ($ticket->ticket_latitude && $ticket->ticket_longitude) {
            $distance = $this->haversine(
                (float) $ticket->ticket_latitude,
                (float) $ticket->ticket_longitude,
                $latitude,
                $longitude
            );

            if ($distance > $radius) {
                $riskScore += 30;
                $reasons[] = 'distance_outside_ticket_radius';
                $status = 'warning';
            }
        }

        if ($accuracy !== null && $accuracy > 100) {
            $riskScore += 20;
            $reasons[] = 'gps_accuracy_above_100m';
            $status = $status === 'valid' ? 'warning' : $status;
        }

        $recentLogs = TechnicianLocationLog::query()
            ->where('user_id', $user->id)
            ->latest('created_at')
            ->limit(5)
            ->get();

        if ($recentLogs->where('latitude', $latitude)->where('longitude', $longitude)->count() >= 3) {
            $riskScore += 10;
            $reasons[] = 'same_coordinates_repeated';
        }

        $lastLog = $recentLogs->first();

        if ($lastLog) {
            $minutes = max($lastLog->created_at->diffInSeconds(now()), 1) / 60;
            $jumpDistance = $this->haversine((float) $lastLog->latitude, (float) $lastLog->longitude, $latitude, $longitude);
            $speedKmh = ($jumpDistance / 1000) / ($minutes / 60);

            if ($speedKmh > 120) {
                $riskScore += 25;
                $reasons[] = 'impossible_movement_speed';
            }

            if ($jumpDistance > 10000 && $minutes < 5) {
                $riskScore += 25;
                $reasons[] = 'location_jump_detected';
            }
        }

        if ($user->area_id && $ticket->area_id && (int) $user->area_id !== (int) $ticket->area_id) {
            $riskScore += 15;
            $reasons[] = 'outside_assigned_area';
        }

        if ($sourceType === 'progress_photo' && $distance !== null && $distance > ($radius * 2)) {
            $riskScore += 20;
            $reasons[] = 'progress_submitted_from_unrealistic_location';
        }

        if ($riskScore >= 80) {
            $status = 'rejected';
        } elseif ($riskScore >= 50) {
            $status = 'suspicious';
        } elseif ($riskScore >= 20) {
            $status = 'warning';
        }

        return [
            'calculated_distance_meter' => $distance,
            'radius_validation_result' => $distance === null ? 'unknown' : ($distance <= $radius ? 'within_radius' : 'outside_radius'),
            'location_status' => $status,
            'risk_score' => $riskScore,
            'risk_reasons' => $reasons,
            'valid_radius_meter' => $radius,
        ];
    }

    public function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return 2 * $earthRadius * asin(min(1, sqrt($a)));
    }
}
