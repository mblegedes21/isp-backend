<?php

namespace App\Http\Controllers;

class LeaderDashboardController extends Controller
{
    public function index()
    {
        return view('leader.dashboard', [
            'title' => 'Leader Dashboard',
            'stats' => [],
        ]);
    }
}
