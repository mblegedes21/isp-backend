<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class StockController extends Controller
{
    public function index()
    {
        $locations = [
            ['location' => 'Pusat', 'product' => 'ONU Model X', 'stock' => 80],
            ['location' => 'Cabang A', 'product' => 'ONU Model X', 'stock' => 20],
            ['location' => 'Cabang B', 'product' => 'ONU Model X', 'stock' => 20],
        ];
        return view('inventory.stock.index', compact('locations'));
    }
}
