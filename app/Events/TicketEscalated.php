<?php

namespace App\Events;

use App\Events\Concerns\BuildsScopedBroadcastChannels;
use App\Models\Escalation;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketEscalated implements ShouldBroadcast
{
    use BuildsScopedBroadcastChannels, Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Ticket $ticket, public ?Escalation $escalation = null)
    {
    }

    public function broadcastOn(): array
    {
        return $this->scopedChannels($this->ticket->branch_id, $this->ticket->area_id, [User::ROLE_MANAGER, User::ROLE_LEADER]);
    }

    public function broadcastAs(): string
    {
        return 'ticket.escalated';
    }

    public function broadcastWith(): array
    {
        return [
            'ticket_id' => $this->ticket->id,
            'status' => $this->ticket->status,
            'reason' => $this->escalation?->type ?: $this->escalation?->reason,
        ];
    }
}
