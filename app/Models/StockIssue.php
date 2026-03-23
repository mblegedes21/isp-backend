<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockIssue extends Model
{
    use HasFactory;

    protected $fillable = [
        'material_id',
        'branch_id',
        'area_id',
        'ticket_id',
        'issued_to',
        'issued_by',
        'quantity',
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

    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }
}
