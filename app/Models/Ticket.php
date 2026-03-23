<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'area_id',
        'branch_id',
        'problem_type',
        'priority',
        'status',
        'leader_id',
        'jenis_pekerjaan',
        'nomor_ticket',
        'technician_id',
        'created_by',
        'escalated_at',
    ];

    protected $casts = [
        'escalated_at' => 'datetime',
    ];

    public const STATUS_FLOW = [
        'CREATED',
        'ASSIGNED',
        'MATERIAL_PREPARED',
        'IN_PROGRESS',
        'ESCALATED',
        'COMPLETED',
        'PENDING_MANAGER_REVIEW',
        'CLOSED',
        'CLOSED_WITH_LOSS',
    ];

    public const ASSIGNABLE_NEW_STATUSES = [
        'CREATED',
        'NEW',
    ];

    public function isReadyForAssignment(): bool
    {
        return in_array(strtoupper((string) $this->status), self::ASSIGNABLE_NEW_STATUSES, true);
    }

    public function technician()
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    public function technicians()
    {
        return $this->belongsToMany(User::class, 'ticket_technicians', 'ticket_id', 'technician_id')->withTimestamps();
    }

    public function leader()
    {
        return $this->belongsTo(User::class, 'leader_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function escalations()
    {
        return $this->hasMany(Escalation::class);
    }

    public function openEscalations(): HasMany
    {
        return $this->hasMany(Escalation::class)->whereIn('status', Escalation::OPEN_STATUSES);
    }

    public function hasOpenEscalation(): bool
    {
        return $this->openEscalations()->exists();
    }

    public function materials()
    {
        return $this->hasMany(TicketMaterial::class);
    }

    public function materialRequests()
    {
        return $this->hasMany(TicketMaterialRequest::class);
    }

    public function materialAssignments()
    {
        return $this->hasMany(TicketMaterialAssignment::class);
    }

    public function progress()
    {
        return $this->hasMany(TicketProgress::class);
    }

    public function materialRemainingEvidence()
    {
        return $this->hasMany(TicketMaterialRemaining::class);
    }
}
