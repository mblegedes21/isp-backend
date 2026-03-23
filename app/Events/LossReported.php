<?php

namespace App\Events;

use App\Events\Concerns\BuildsScopedBroadcastChannels;
use App\Models\LossReport;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LossReported implements ShouldBroadcast
{
    use BuildsScopedBroadcastChannels, Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public LossReport $lossReport)
    {
    }

    public function broadcastOn(): array
    {
        return $this->scopedChannels($this->lossReport->branch_id, $this->lossReport->area_id, [User::ROLE_MANAGER, User::ROLE_LEADER]);
    }

    public function broadcastAs(): string
    {
        return 'loss.reported';
    }

    public function broadcastWith(): array
    {
        return ['loss_report_id' => $this->lossReport->id, 'status' => $this->lossReport->status];
    }
}
