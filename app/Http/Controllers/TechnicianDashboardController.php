<?php

namespace App\Http\Controllers;

class TechnicianDashboardController extends Controller
{
    public function index()
    {
        return view('technician.dashboard', [
            'title' => 'Technician Dashboard',
            'stats' => [],
        ]);
    }
}
