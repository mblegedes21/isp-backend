<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TicketImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'branch_id',
        'area_id',
        'uploaded_by',
        'disk',
        'path',
        'temp_path',
        'original_name',
        'mime_type',
        'size_bytes',
        'width',
        'height',
        'status',
        'processed_at',
    ];

    protected $casts = [
        'processed_at' => 'datetime',
    ];
}
