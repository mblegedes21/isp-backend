<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AreaAction extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'area_id',
        'area_name',
        'action',
        'created_by',
    ];
}
