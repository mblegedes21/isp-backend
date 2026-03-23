<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ReportsController extends Controller
{
    public function index()
    {
        $cards = [
            ['title' => 'Usage by Technician', 'value' => '-', 'desc' => 'Placeholder report'],
            ['title' => 'Usage by Ticket', 'value' => '-', 'desc' => 'Placeholder report'],
            ['title' => 'Outstanding Aging', 'value' => '-', 'desc' => 'Placeholder report'],
            ['title' => 'Stock Summary', 'value' => '-', 'desc' => 'Placeholder report'],
        ];
        return view('reports.index', compact('cards'));
    }
}
