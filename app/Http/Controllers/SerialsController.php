<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SerialsController extends Controller
{
    public function index()
    {
        $serials = [
            ['serial' => 'SN-A10001', 'product' => 'ONU Model X', 'status' => 'Available', 'location' => 'Pusat'],
            ['serial' => 'SN-A10024', 'product' => 'Splitter 1:8', 'status' => 'Outstanding', 'location' => 'Cabang A'],
        ];
        return view('inventory.serials.index', compact('serials'));
    }

    public function import()
    {
        return view('inventory.serials.import');
    }

    public function show($id)
    {
        $batch = ['id' => $id, 'count' => 12, 'product' => 'ONU Model X'];
        return view('inventory.serials.show', compact('batch'));
    }
}
