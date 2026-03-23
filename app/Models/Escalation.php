<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Escalation extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'created_by',
        'role',
        'type',
        'severity',
        'impact',
        'requires_immediate_action',
        'description',
        'status',
        'ticket_status_before',
        'handled_by',
        'handled_at',
        'branch_id',
        'area_id',
        'reason',
        'note',
        'escalated_by',
    ];

    protected $casts = [
        'requires_immediate_action' => 'boolean',
        'handled_at' => 'datetime',
    ];

    public const TYPES = [
        'disaster',
        'external_blocker',
        'permit_issue',
        'technical_blocker',
        'safety_issue',
        'operational_issue',
        'emergency',
    ];

    public const SEVERITIES = [
        'low',
        'medium',
        'high',
        'critical',
    ];

    public const IMPACTS = [
        'single_user',
        'area',
        'multiple_area',
        'outage',
    ];

    public const STATUSES = [
        'pending',
        'approved',
        'rejected',
        'resolved',
    ];

    public const OPEN_STATUSES = [
        'pending',
        'approved',
    ];

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function escalator()
    {
        return $this->belongsTo(User::class, 'escalated_by');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function handler()
    {
        return $this->belongsTo(User::class, 'handled_by');
    }
}
