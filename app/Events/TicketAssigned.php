<?php

namespace App\Events;

use App\Events\Concerns\BuildsScopedBroadcastChannels;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketAssigned implements ShouldBroadcast
{
    use BuildsScopedBroadcastChannels, Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Ticket $ticket)
    {
    }

    public function broadcastOn(): array
    {
        return $this->scopedChannels($this->ticket->branch_id, $this->ticket->area_id, [User::ROLE_MANAGER, User::ROLE_LEADER, User::ROLE_TEKNISI]);
    }

    public function broadcastAs(): string
    {
        return 'ticket.assigned';
    }

    public function broadcastWith(): array
    {
        return [
            'ticket_id' => $this->ticket->id,
            'leader_id' => $this->ticket->leader_id,
            'technician_id' => $this->ticket->technician_id,
            'status' => $this->ticket->status,
        ];
    }
}
