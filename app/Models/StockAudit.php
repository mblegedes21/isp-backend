<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockAudit extends Model
{
    use HasFactory;

    protected $fillable = [
        'material_id',
        'branch_id',
        'system_stock',
        'physical_stock',
        'difference',
        'unit_price',
        'total_difference_value',
        'notes',
        'created_by',
        'status',
    ];

    public function material()
    {
        return $this->belongsTo(Material::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
