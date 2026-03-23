<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockReceipt extends Model
{
    use HasFactory;

    protected $fillable = [
        'material_id',
        'branch_id',
        'received_by',
        'quantity',
        'source',
        'notes',
    ];

    public function material()
    {
        return $this->belongsTo(Material::class, 'material_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'received_by');
    }
}
