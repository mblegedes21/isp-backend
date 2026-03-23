<?php

namespace App\Http\Controllers\Leader;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Ticket;

class LeaderRequestController extends Controller
{
    /**
     * List requests pending leader approval
     */
    public function index()
    {
        $requests = Ticket::where('status', 'pending_leader')->with(['materials.product'])->get();
        return view('leader.permintaan.index', compact('requests'));
    }

    /**
     * Show request details
     */
    public function show($id)
    {
        $request = Ticket::with(['materials.product'])->findOrFail($id);
        return view('leader.permintaan.show', compact('request'));
    }

    /**
     * Approve request - forward to gudang
     */
    public function approve($id)
    {
        $ticket = Ticket::findOrFail($id);
        $ticket->update(['status' => 'approved']);
        return back()->with('status', 'Request approved');
    }

    /**
     * Reject request
     */
    public function reject($id)
    {
        $ticket = Ticket::findOrFail($id);
        $ticket->update(['status' => 'rejected']);
        return back()->with('status', 'Request rejected');
    }
}
