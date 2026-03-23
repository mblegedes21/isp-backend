<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class OwnerController extends Controller
{
    public function monitoring()
    {
        $summary = [
            'total_aset' => 125000000,
            'nilai_onu' => 45000000,
            'nilai_outstanding' => 15000000,
            'nilai_proyek' => 25000000,
            'nilai_transit' => 20000000,
        ];

        $by_location = [
            ['loc' => 'Pusat', 'value' => 60000000],
            ['loc' => 'Cabang A', 'value' => 35000000],
            ['loc' => 'Cabang B', 'value' => 30000000],
        ];

        $by_leader = [
            ['leader' => 'Leader A', 'value' => 70000000],
            ['leader' => 'Leader B', 'value' => 55000000],
        ];

        return view('owner.monitoring', compact('summary', 'by_location', 'by_leader'));
    }

    public function kasusIndex()
    {
        $cases = session('sim_cases', [['case_id' => 'KS-0001', 'project_id' => 'PRJ-0999', 'lokasi' => 'Pusat', 'leader' => 'Leader B', 'teknisi' => 'Rina', 'selisih_qty' => 2, 'selisih_rp' => 2500000, 'status' => 'Menunggu Review']]);
        return view('owner.kasus-selisih', compact('cases'));
    }

    public function kasusShow($id)
    {
        // In real app, fetch case by id. Here we show dummy
        return view('owner.kasus-selisih-show', compact('id'));
    }

    public function kasusAction(\Illuminate\Http\Request $request, $id)
    {
        $action = $request->input('action');
        session()->flash('status', 'Aksi "' . $action . '" disimpan (simulasi).');
        return redirect()->route('manager.dashboard');
    }
}
