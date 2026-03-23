<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TicketProgressPhoto extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'user_id',
        'branch_id',
        'area_id',
        'progress_type',
        'image_path',
        'temp_path',
        'image_size_kb',
        'latitude',
        'longitude',
        'accuracy',
        'calculated_distance_meter',
        'location_status',
        'needs_review',
        'risk_score',
        'risk_reasons',
        'captured_at_server',
        'uploaded_at_server',
        'ip_address',
        'user_agent',
        'mime_type',
        'status',
    ];

    protected $casts = [
        'needs_review' => 'boolean',
        'risk_reasons' => 'array',
        'captured_at_server' => 'datetime',
        'uploaded_at_server' => 'datetime',
    ];

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }
}
