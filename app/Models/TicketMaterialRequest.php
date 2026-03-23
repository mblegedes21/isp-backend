<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TicketMaterialRequest extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'PENDING';
    public const STATUS_APPROVED = 'APPROVED';
    public const STATUS_RELEASED = 'RELEASED';
    public const STATUS_PARTIAL_RETURN = 'PARTIAL_RETURN';
    public const STATUS_RETURNED = 'RETURNED';

    protected $fillable = [
        'ticket_id',
        'material_id',
        'teknisi_id',
        'technician_id',
        'quantity',
        'requested_by',
        'requested_role',
        'status',
        'released_by',
        'return_verified_by',
        'released_quantity',
        'returned_quantity',
    ];

    protected static function booted(): void
    {
        static::saving(function (self $request) {
            if ($request->teknisi_id && !$request->technician_id) {
                $request->technician_id = $request->teknisi_id;
            }

            if ($request->technician_id && !$request->teknisi_id) {
                $request->teknisi_id = $request->technician_id;
            }
        });
    }

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

    public function teknisi()
    {
        return $this->belongsTo(User::class, 'teknisi_id');
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function releaser()
    {
        return $this->belongsTo(User::class, 'released_by');
    }

    public function returnVerifier()
    {
        return $this->belongsTo(User::class, 'return_verified_by');
    }
}
