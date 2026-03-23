<?php

namespace App\Services;

use App\Models\StockMovement;

class StockLedger
{
    public function record(
        int $productId,
        int $locationId,
        string $type,
        int $qty,
        ?string $referenceType = null,
        ?int $referenceId = null
    ) {
        if ($qty <= 0) {
            throw new \Exception("Stock qty must be positive");
        }

        StockMovement::create([
            'product_id' => $productId,
            'location_id' => $locationId,
            'type' => $type,
            'qty' => $qty,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
        ]);
    }
}
