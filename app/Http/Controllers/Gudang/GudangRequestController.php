<?php

namespace App\Http\Controllers\Gudang;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Ticket;

class GudangRequestController extends Controller
{
    /**
     * List approved requests ready for gudang processing
     */
    public function index()
    {
        $requests = Ticket::where('status', 'approved')->with(['materials.product'])->get();
        return view('gudang.permintaan.index', compact('requests'));
    }

    /**
     * Show request details
     */
    public function show($id)
    {
        $request = Ticket::with(['materials.product'])->findOrFail($id);
        return view('gudang.permintaan.show', compact('request'));
    }

    /**
     * Mark request as being processed by gudang
     */
    public function approve($id)
    {
        $ticket = Ticket::findOrFail($id);
        $ticket->update(['status' => 'active']);
        return back()->with('status', 'Request marked as active');
    }
}
