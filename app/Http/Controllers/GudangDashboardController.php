<?php

namespace App\Http\Controllers;

class GudangDashboardController extends Controller
{
    public function index()
    {
        return view('gudang.dashboard', [
            'title' => 'Gudang Dashboard',
            'stats' => [],
        ]);
    }
}
