<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'material_id',
        'branch_id',
        'area_id',
        'ticket_id',
        'user_id',
        'created_by',
        'transaction_type',
        'type',
        'quantity',
        'unit_price',
        'total_price',
        'reference_type',
        'reference_id',
        'notes',
    ];

    public const TYPES = [
        'IN',
        'OUT',
        'TRANSFER',
        'LOSS',
        'RETURN',
        'AUDIT_ADJUSTMENT',
    ];

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

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
