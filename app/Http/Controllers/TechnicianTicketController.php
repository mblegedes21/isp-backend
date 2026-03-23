<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Ticket;
use App\Models\TicketProgress;

/**
 * @deprecated Use App\Http\Controllers\Technician\TechnicianTicketController instead
 */
class TechnicianTicketController extends Controller
{
    public function index()
    {
        $tickets = Ticket::where('technician_id', auth()->id())->get();
        return view('technician.tickets.index', compact('tickets'));
    }

    public function show($id)
    {
        $ticket = Ticket::with(['materials.product', 'progress'])->findOrFail($id);
        return view('technician.tickets.show', compact('ticket'));
    }

    public function create()
    {
        return view('technician.tickets.create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'jenis_pekerjaan' => ['required', 'in:' . implode(',', Ticket::JENIS_OPTIONS)],
        ]);

        $ticket = Ticket::create([
            'technician_id' => auth()->id(),
            'jenis_pekerjaan' => $data['jenis_pekerjaan'],
            'nomor_ticket' => 'TCK-' . Str::upper(Str::random(6)),
            'status' => Ticket::STATUS_ACTIVE,
        ]);

        return redirect()->route('technician.tickets.show', $ticket->id);
    }

    public function storeProgress(Request $request, $id)
    {
        $ticket = Ticket::findOrFail($id);

        $validated = $request->validate([
            'deskripsi' => 'required|string',
            'foto' => 'nullable|image|max:2048',
        ]);

        $path = null;
        if ($request->hasFile('foto')) {
            $path = $request->file('foto')->store('ticket_progress', 'public');
        }

        $ticket->progress()->create([
            'deskripsi' => $validated['deskripsi'],
            'foto_path' => $path,
        ]);

        return back();
    }

    public function close(Request $request, $id)
    {
        $ticket = Ticket::findOrFail($id);
        $ticket->status = Ticket::STATUS_CLOSED;
        $ticket->save();
        return back();
    }
}
