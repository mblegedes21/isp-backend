<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\StockLedger;
use App\Services\StockService;
use App\Models\Product;

class WarehouseController extends Controller
{
    public function issue()
    {
        $products = [
            ['sku' => 'ONU-X', 'name' => 'ONU Model X'],
            ['sku' => 'RTR-Y', 'name' => 'Router Y'],
        ];
        return view('warehouse.issue', compact('products'));
    }

    public function returnForm()
    {
        $recent = [
            ['serial' => 'SN-A10001', 'product' => 'ONU Model X', 'date' => '2026-02-20'],
        ];
        return view('warehouse.return', compact('recent'));
    }

    public function outstanding()
    {
        $outstanding = [
            ['serial' => 'SN-A10024', 'product' => 'Splitter 1:8', 'age' => '5d', 'location' => 'Cabang A'],
            ['serial' => 'SN-B20011', 'product' => 'Router Y', 'age' => '20d', 'location' => 'Cabang B'],
        ];
        return view('warehouse.outstanding', compact('outstanding'));
    }

    public function transfer()
    {
        $locations = ['Pusat', 'Cabang A', 'Cabang B'];
        // In a real app these would come from the Product model + stock service.
        $products = [
            ['sku' => 'ONU-X', 'name' => 'ONU Model X', 'serialized' => true],
            ['sku' => 'SPL-1:8', 'name' => 'Splitter 1:8', 'serialized' => false],
        ];

        // ledger example: when a transfer is created/approved the controller
        // should record STOCK_OUT for the origin and STOCK_IN for the
        // destination.  Since the current UI is static we only include a comment
        // to show where to integrate StockLedger.
        // $ledger = new StockLedger();
        // $ledger->record($productId, $originLocation, 'TRANSFER_OUT', $qty, 'transfer');
        // $ledger->record($productId, $destLocation,   'TRANSFER_IN',  $qty, 'transfer');

        $history = [
            ['id' => 'TRF-0001', 'from' => 'Pusat', 'to' => 'Cabang A', 'date' => '2026-02-20', 'status' => 'Menunggu Persetujuan'],
            ['id' => 'TRF-0002', 'from' => 'Cabang A', 'to' => 'Pusat', 'date' => '2026-02-21', 'status' => 'Dalam Pengiriman'],
            ['id' => 'TRF-0003', 'from' => 'Pusat', 'to' => 'Cabang B', 'date' => '2026-02-22', 'status' => 'Disetujui'],
        ];

        return view('warehouse.transfer', compact('locations', 'products', 'history'));
    }

    public function incoming()
    {
        $in_transit = [
            ['id' => 'TRF-0002', 'from' => 'Cabang A', 'to' => 'Pusat', 'date' => '2026-02-21', 'items' => ['SN-A10001', 'SN-A10002']],
            ['id' => 'TRF-0004', 'from' => 'Cabang B', 'to' => 'Pusat', 'date' => '2026-02-24', 'items' => ['SN-C30011']],
        ];

        return view('warehouse.incoming', compact('in_transit'));
    }
}
