<?php

namespace App\Http\Controllers\Technician;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Ticket;
use App\Models\TicketProgress;

class TechnicianTicketController extends Controller
{
    /**
     * List all technician tickets
     */
    public function index()
    {
        $user_id = auth()->id() ?? 1; // Default to 1 for dev mode
        $tickets = Ticket::where('technician_id', $user_id)->get();
        return view('technician.tickets.index', compact('tickets'));
    }

    /**
     * Show ticket creation form
     */
    public function create()
    {
        return view('technician.tickets.create');
    }

    /**
     * Store new ticket
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'jenis_pekerjaan' => 'required|string',
        ]);

        $ticket = Ticket::create([
            'technician_id' => auth()->id() ?? 1,
            'jenis_pekerjaan' => $validated['jenis_pekerjaan'],
            'nomor_ticket' => 'TCK-' . Str::upper(Str::random(6)),
            'status' => 'pending_leader',
        ]);

        return redirect()->route('technician.tickets.show', $ticket->id);
    }

    /**
     * Show ticket details with materials and progress
     */
    public function show($id)
    {
        $ticket = Ticket::with(['materials.product', 'progress'])->findOrFail($id);
        return view('technician.tickets.show', compact('ticket'));
    }

    /**
     * Store progress update on ticket
     */
    public function storeProgress(Request $request, $id)
    {
        $validated = $request->validate([
            'deskripsi' => 'required|string',
            'foto' => 'nullable|image|max:2048',
        ]);

        $ticket = Ticket::findOrFail($id);

        $path = null;
        if ($request->hasFile('foto')) {
            $path = $request->file('foto')->store('ticket_progress', 'public');
        }

        TicketProgress::create([
            'ticket_id' => $ticket->id,
            'deskripsi' => $validated['deskripsi'],
            'foto_path' => $path,
        ]);

        return back()->with('status', 'Progress updated');
    }

    /**
     * Close ticket (mark for leader review)
     */
    public function close(Request $request, $id)
    {
        $ticket = Ticket::findOrFail($id);
        $ticket->update(['status' => 'waiting_leader_review']);
        return back()->with('status', 'Ticket marked for review');
    }
}
