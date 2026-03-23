<?php

namespace App\Events;

use App\Events\Concerns\BuildsScopedBroadcastChannels;
use App\Models\Attendance;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AttendanceFlagged implements ShouldBroadcast
{
    use BuildsScopedBroadcastChannels, Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Attendance $attendance, public string $flagType)
    {
    }

    public function broadcastOn(): array
    {
        return $this->scopedChannels($this->attendance->branch_id, $this->attendance->area_id, [User::ROLE_MANAGER, User::ROLE_LEADER]);
    }

    public function broadcastAs(): string
    {
        return 'attendance.flagged';
    }

    public function broadcastWith(): array
    {
        return [
            'attendance_id' => $this->attendance->id,
            'user_id' => $this->attendance->user_id,
            'flag_type' => $this->flagType,
        ];
    }
}
