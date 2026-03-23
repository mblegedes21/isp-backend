<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TicketProgress extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'deskripsi',
        'foto_path',
    ];

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }
}
