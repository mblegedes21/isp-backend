<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceFlag extends Model
{
    use HasFactory;

    protected $fillable = [
        'attendance_id',
        'user_id',
        'branch_id',
        'area_id',
        'flag_type',
        'status',
        'context',
    ];

    protected $casts = [
        'context' => 'array',
    ];

    public function attendance()
    {
        return $this->belongsTo(Attendance::class);
    }
}
