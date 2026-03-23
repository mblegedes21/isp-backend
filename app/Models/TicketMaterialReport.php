<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TicketMaterialReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'technician_id',
        'material_id',
        'branch_id',
        'area_id',
        'material_used',
        'material_remaining',
        'quantity_used',
        'quantity_remaining',
        'photo_path',
        'photo_temp_path',
        'remaining_photo_path',
        'remaining_photo_temp_path',
        'latitude',
        'longitude',
        'accuracy',
        'captured_at_server',
        'uploaded_at_server',
        'status',
    ];

    protected $casts = [
        'quantity_used' => 'integer',
        'quantity_remaining' => 'integer',
        'captured_at_server' => 'datetime',
        'uploaded_at_server' => 'datetime',
    ];

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function material()
    {
        return $this->belongsTo(Material::class);
    }

    public function technician()
    {
        return $this->belongsTo(User::class, 'technician_id');
    }
}
