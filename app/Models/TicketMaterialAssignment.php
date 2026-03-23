<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TicketMaterialAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'technician_id',
        'material_id',
        'ticket_material_request_id',
        'quantity_assigned',
        'quantity_returned',
    ];

    protected $casts = [
        'quantity_assigned' => 'integer',
        'quantity_returned' => 'integer',
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
        return $this->belongsTo(Material::class);
    }

    public function request()
    {
        return $this->belongsTo(TicketMaterialRequest::class, 'ticket_material_request_id');
    }
}
