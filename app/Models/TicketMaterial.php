<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TicketMaterial extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'branch_id',
        'area_id',
        'material_id',
        'teknisi_id',
        'technician_id',
        'quantity',
        'source_type',
        'product_id',
        'qty',
    ];

    protected static function booted(): void
    {
        static::saving(function (self $ticketMaterial) {
            if ($ticketMaterial->teknisi_id && !$ticketMaterial->technician_id) {
                $ticketMaterial->technician_id = $ticketMaterial->teknisi_id;
            }

            if ($ticketMaterial->technician_id && !$ticketMaterial->teknisi_id) {
                $ticketMaterial->teknisi_id = $ticketMaterial->technician_id;
            }

            if ($ticketMaterial->quantity && !$ticketMaterial->qty) {
                $ticketMaterial->qty = $ticketMaterial->quantity;
            }

            if ($ticketMaterial->qty && !$ticketMaterial->quantity) {
                $ticketMaterial->quantity = $ticketMaterial->qty;
            }

            if ($ticketMaterial->material_id && !$ticketMaterial->product_id) {
                $ticketMaterial->product_id = $ticketMaterial->material_id;
            }
        });
    }

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function product()
    {
        return $this->belongsTo(Material::class, 'product_id');
    }

    public function material()
    {
        return $this->belongsTo(Material::class, 'material_id');
    }

    public function technician()
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    public function teknisi()
    {
        return $this->belongsTo(User::class, 'teknisi_id');
    }
}
