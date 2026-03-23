<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class LeaderController extends Controller
{
    public function review()
    {
        $requests = [
            ['id' => 201, 'technician' => 'Andi', 'type' => 'Instalasi', 'items' => [['name' => 'ONU Model X', 'qty' => 1]], 'status' => 'Menunggu Review', 'date' => '2026-02-24'],
            ['id' => 202, 'technician' => 'Rina', 'type' => 'Maintenance', 'items' => [['name' => 'Splitter 1:8', 'qty' => 1]], 'status' => 'Menunggu Review', 'date' => '2026-02-23'],
        ];
        return view('leader.review', compact('requests'));
    }

    public function projects()
    {
        $projects = [
            ['id' => 'PRJ-001', 'technician' => 'Andi', 'issued' => 10, 'returned' => 2, 'diff' => 8],
            ['id' => 'PRJ-002', 'technician' => 'Rina', 'issued' => 6, 'returned' => 1, 'diff' => 5],
        ];
        return view('leader.proyek', compact('projects'));
    }

    public function kasusIndex()
    {
        $cases = [['case_id' => 'KS-0001', 'project_id' => 'PRJ-0999', 'lokasi' => 'Pusat', 'status' => 'Menunggu Review']];
        return view('leader.kasus-selisih', compact('cases'));
    }

    public function kasusShow($id)
    {
        return view('leader.kasus-selisih-show', compact('id'));
    }

    public function submitBanding(\Illuminate\Http\Request $request, $id)
    {
        // simulate submitting a banding
        session()->flash('status', 'Banding diajukan (simulasi).');
        return redirect()->route('leader.dashboard');
    }
}
