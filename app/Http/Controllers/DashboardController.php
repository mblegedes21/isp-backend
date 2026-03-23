<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        // Main dashboard - accessible to all authenticated users
        // Users are redirected to role-specific dashboard after login
        // This serves as fallback for users without a specific role
        // Static placeholder data for dashboard (UI-only)
        $kpis = [
            ['label' => 'Open Requests', 'value' => 128],
            ['label' => 'Pending Approvals', 'value' => 24],
            ['label' => 'Items Issued (30d)', 'value' => 542],
            ['label' => 'Items Returned (30d)', 'value' => 63],
            ['label' => 'Total Products', 'value' => 412],
            ['label' => 'Locations', 'value' => 3],
        ];

        $recentRequests = [
            ['id' => 101, 'title' => 'Replace ONU - Pusat', 'requester' => 'John', 'status' => 'Open', 'date' => '2026-02-24'],
            ['id' => 102, 'title' => 'Return Cable - Cabang A', 'requester' => 'Siti', 'status' => 'Approved', 'date' => '2026-02-23'],
            ['id' => 103, 'title' => 'Install Router - Cabang B', 'requester' => 'Budi', 'status' => 'Pending', 'date' => '2026-02-22'],
            ['id' => 104, 'title' => 'Replace Splitter - Pusat', 'requester' => 'Ayu', 'status' => 'Open', 'date' => '2026-02-20'],
        ];

        $outstandingSerials = [
            ['serial' => 'SN-A10001', 'product' => 'ONU Model X', 'age' => '12d', 'location' => 'Pusat'],
            ['serial' => 'SN-A10024', 'product' => 'Splitter 1:8', 'age' => '5d', 'location' => 'Cabang A'],
            ['serial' => 'SN-B20011', 'product' => 'Router Y', 'age' => '20d', 'location' => 'Cabang B'],
        ];

        $inventorySummary = [
            ['product' => 'ONU Model X', 'stock' => 120, 'reserved' => 8],
            ['product' => 'Splitter 1:8', 'stock' => 60, 'reserved' => 2],
            ['product' => 'Router Y', 'stock' => 45, 'reserved' => 5],
            ['product' => 'Fiber Patch 1m', 'stock' => 300, 'reserved' => 10],
        ];

        return view('dashboard', compact('kpis', 'recentRequests', 'outstandingSerials', 'inventorySummary'));
    }
}
