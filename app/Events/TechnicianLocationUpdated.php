<?php

namespace App\Events;

use App\Events\Concerns\BuildsScopedBroadcastChannels;
use App\Models\TechnicianLocationLog;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TechnicianLocationUpdated implements ShouldBroadcast
{
    use BuildsScopedBroadcastChannels, Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public TechnicianLocationLog $locationLog)
    {
    }

    public function broadcastOn(): array
    {
        return $this->scopedChannels($this->locationLog->branch_id, $this->locationLog->area_id, [User::ROLE_MANAGER]);
    }

    public function broadcastAs(): string
    {
        return 'technician.location-updated';
    }

    public function broadcastWith(): array
    {
        return [
            'user_id' => $this->locationLog->user_id,
            'ticket_id' => $this->locationLog->ticket_id,
            'latitude' => $this->locationLog->latitude,
            'longitude' => $this->locationLog->longitude,
            'accuracy' => $this->locationLog->accuracy,
            'location_status' => $this->locationLog->location_status,
            'risk_score' => $this->locationLog->risk_score,
            'created_at' => $this->locationLog->created_at?->toIso8601String(),
        ];
    }
}
