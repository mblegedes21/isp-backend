<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Incident extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'area_id',
        'severity',
        'ticket_count',
        'escalation_count',
        'detected_at',
        'response_status',
    ];

    protected $casts = [
        'detected_at' => 'datetime',
    ];

    public function area()
    {
        return $this->belongsTo(Area::class);
    }
}
