<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Material extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'id',
        'category_id',
        'brand_id',
        'brand',
        'name',
        'sku',
        'unit',
        'stock',
        'minimum_stock',
        'purchase_price',
        'branch_id',
        'description',
        'is_active',
    ];

    public $incrementing = true;

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(MaterialCategory::class, 'category_id');
    }

    public function brandOption()
    {
        return $this->belongsTo(MaterialBrand::class, 'brand_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
