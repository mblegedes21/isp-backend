<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'mitra_id',
        'name',
        'nik',
        'no_hp',
        'alamat',
        'latitude',
        'longitude',
        'package_name',
        'package_price',
        'ppn',
        'bhp',
        'uso',
        'total_price',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'package_price' => 'decimal:2',
        'ppn' => 'decimal:2',
        'bhp' => 'decimal:2',
        'uso' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function mitra()
    {
        return $this->belongsTo(User::class, 'mitra_id');
    }
}
