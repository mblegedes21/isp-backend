<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'name',
        'sku',
        'category',
        'price',
        'stok',
        'min_stock',
        'unit_type',
        'is_active',
        'description',
        'lead_time_days',
        'is_serialized',
        'avg_daily_usage',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function stockTransactions()
    {
        return $this->hasMany(StockTransaction::class, 'material_id');
    }
}
