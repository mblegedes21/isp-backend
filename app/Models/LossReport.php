<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LossReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'branch_id',
        'area_id',
        'technician_id',
        'material_id',
        'quantity',
        'unit_price',
        'total_price',
        'loss_percent',
        'reason',
        'evidence_path',
        'status',
        'rejected_reason',
    ];

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function technician()
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    public function material()
    {
        return $this->belongsTo(Material::class, 'material_id');
    }

    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
