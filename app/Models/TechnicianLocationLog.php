<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TechnicianLocationLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'ticket_id',
        'branch_id',
        'area_id',
        'latitude',
        'longitude',
        'accuracy',
        'calculated_distance_meter',
        'location_status',
        'needs_review',
        'risk_score',
        'risk_reasons',
        'source_type',
    ];

    protected $casts = [
        'needs_review' => 'boolean',
        'risk_reasons' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function area()
    {
        return $this->belongsTo(Area::class);
    }
}
