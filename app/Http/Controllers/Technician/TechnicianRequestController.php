<?php

namespace App\Http\Controllers\Technician;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Ticket;
use App\Models\TicketMaterial;

class TechnicianRequestController extends Controller
{
    /**
     * Show form to create material request
     */
    public function create()
    {
        $products = [
            ['id' => 1, 'sku' => 'ONU-X', 'name' => 'ONU Model X'],
            ['id' => 2, 'sku' => 'SPL-1:8', 'name' => 'Splitter 1:8'],
            ['id' => 3, 'sku' => 'ODP-8', 'name' => 'ODP 8 Port'],
        ];
        return view('technician.permintaan.create', compact('products'));
    }

    /**
     * Store new material request (creates ticket)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'materials' => 'required|array|min:1',
            'materials.*.product_id' => 'required|exists:products,id',
            'materials.*.qty' => 'required|integer|min:1',
        ]);

        // Create ticket for this request
        $ticket = Ticket::create([
            'technician_id' => auth()->id() ?? 1,  // Default to 1 for dev mode
            'jenis_pekerjaan' => 'Permintaan Material',
            'nomor_ticket' => 'REQ-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6)),
            'status' => 'pending_leader',
        ]);

        // Add materials to ticket
        foreach ($validated['materials'] as $item) {
            TicketMaterial::create([
                'ticket_id' => $ticket->id,
                'product_id' => $item['product_id'],
                'qty' => $item['qty'],
            ]);
        }

        session()->flash('status', 'Permintaan barang telah dibuat (Ticket: ' . $ticket->nomor_ticket . ')');
        return redirect()->route('technician.permintaan.create');
    }
}
