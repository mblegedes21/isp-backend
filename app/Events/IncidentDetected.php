<?php

namespace App\Events;

use App\Events\Concerns\BuildsScopedBroadcastChannels;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class IncidentDetected implements ShouldBroadcast
{
    use BuildsScopedBroadcastChannels, Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $branchId,
        public int $areaId,
        public int $ticketCount,
        public int $escalationCount
    ) {
    }

    public function broadcastOn(): array
    {
        return $this->scopedChannels($this->branchId, $this->areaId, [User::ROLE_MANAGER, User::ROLE_LEADER]);
    }

    public function broadcastAs(): string
    {
        return 'incident.detected';
    }

    public function broadcastWith(): array
    {
        return [
            'branch_id' => $this->branchId,
            'area_id' => $this->areaId,
            'ticket_count' => $this->ticketCount,
            'escalation_count' => $this->escalationCount,
        ];
    }
}
