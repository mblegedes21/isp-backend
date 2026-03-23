<?php

namespace App\Services;

use App\Models\StockMovement;

class StockService
{
    public function getAvailable($productId, $locationId)
    {
        $in = StockMovement::where('product_id', $productId)
            ->where('location_id', $locationId)
            ->whereIn('type', ['IN', 'TRANSFER_IN', 'PROJECT_RETURN'])
            ->sum('qty');

        $out = StockMovement::where('product_id', $productId)
            ->where('location_id', $locationId)
            ->whereIn('type', ['OUT', 'TRANSFER_OUT', 'PROJECT_OUT'])
            ->sum('qty');

        return $in - $out;
    }
}
