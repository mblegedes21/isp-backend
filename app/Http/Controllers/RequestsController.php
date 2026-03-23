<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class RequestsController extends Controller
{
    public function index()
    {
        $requests = [
            ['no' => 101, 'ticket' => 'TCK-2026-001', 'technician' => 'John', 'status' => 'Open', 'date' => '2026-02-24'],
            ['no' => 102, 'ticket' => 'TCK-2026-002', 'technician' => 'Siti', 'status' => 'Approved', 'date' => '2026-02-23'],
            ['no' => 103, 'ticket' => 'TCK-2026-003', 'technician' => 'Budi', 'status' => 'Pending', 'date' => '2026-02-22'],
        ];
        return view('requests.index', compact('requests'));
    }

    public function create()
    {
        // sample items to display in items table
        $items = [
            ['sku' => 'ONU-X', 'description' => 'ONU Model X', 'qty' => 1],
            ['sku' => 'SPL-1:8', 'description' => 'Splitter 1:8', 'qty' => 1],
        ];
        return view('requests.create', compact('items'));
    }

    public function show($id)
    {
        $request = ['id' => $id, 'ticket' => 'TCK-2026-00' . $id, 'technician' => 'John', 'status' => 'Open', 'date' => '2026-02-24'];
        $items = [
            ['sku' => 'ONU-X', 'description' => 'ONU Model X', 'qty' => 1, 'serials' => ['SN-A10001']],
        ];
        return view('requests.show', compact('request', 'items'));
    }
}
