<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WarehouseTransaction extends Model
{
    use HasFactory;

    public const TYPE_ANTAR_GUDANG_IN = 'antar_gudang_in';
    public const TYPE_PENGEMBALIAN_TEKNISI = 'pengembalian_teknisi';
    public const TYPE_PEMBELIAN_MATERIAL = 'pembelian_material';
    public const TYPE_ANTAR_GUDANG_OUT = 'antar_gudang_out';
    public const TYPE_PENGELUARAN_TEKNISI = 'pengeluaran_teknisi';
    public const TYPE_PENJUALAN_MATERIAL = 'penjualan_material';
    public const TYPE_TECHNICIAN_OUT = 'technician_out';
    public const TYPE_TECHNICIAN_RETURN = 'technician_return';

    public const TYPES = [
        self::TYPE_ANTAR_GUDANG_IN,
        self::TYPE_PENGEMBALIAN_TEKNISI,
        self::TYPE_PEMBELIAN_MATERIAL,
        self::TYPE_ANTAR_GUDANG_OUT,
        self::TYPE_PENGELUARAN_TEKNISI,
        self::TYPE_PENJUALAN_MATERIAL,
        self::TYPE_TECHNICIAN_OUT,
        self::TYPE_TECHNICIAN_RETURN,
    ];

    public const INBOUND_TYPES = [
        self::TYPE_ANTAR_GUDANG_IN,
        self::TYPE_PENGEMBALIAN_TEKNISI,
        self::TYPE_PEMBELIAN_MATERIAL,
        self::TYPE_TECHNICIAN_RETURN,
    ];

    public const OUTBOUND_TYPES = [
        self::TYPE_ANTAR_GUDANG_OUT,
        self::TYPE_PENGELUARAN_TEKNISI,
        self::TYPE_PENJUALAN_MATERIAL,
        self::TYPE_TECHNICIAN_OUT,
    ];

    protected $fillable = [
        'material_id',
        'transaction_type',
        'quantity',
        'unit_price',
        'total_price',
        'source_branch',
        'destination_branch',
        'technician_id',
        'supplier',
        'customer',
        'ticket_id',
        'purchase_request_id',
        'condition',
        'status',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function material()
    {
        return $this->belongsTo(Material::class);
    }

    public function technician()
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function purchaseRequest()
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
