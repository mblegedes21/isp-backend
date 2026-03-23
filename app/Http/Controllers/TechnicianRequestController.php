<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;

/**
 * @deprecated Use App\Http\Controllers\Technician\TechnicianRequestController instead
 */
class TechnicianRequestController extends Controller
{
    public function create()
    {
        $products = Product::all();
        return view('technician.requests.create', compact('products'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'materials' => 'required|array|min:1',
            'materials.*.product_id' => 'required|exists:products,id',
            'materials.*.qty' => 'required|integer|min:1',
        ]);

        // create a ticket to represent this request
        $ticket = \App\Models\Ticket::create([
            'technician_id' => auth()->id(),
            'jenis_pekerjaan' => 'Permintaan',
            'nomor_ticket' => 'REQ-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6)),
            'status' => \App\Models\Ticket::STATUS_ACTIVE,
        ]);

        foreach ($data['materials'] as $item) {
            \App\Models\TicketMaterial::create([
                'ticket_id' => $ticket->id,
                'product_id' => $item['product_id'],
                'qty' => $item['qty'],
            ]);
        }

        session()->flash('status', 'Permintaan barang telah dibuat (ticket ' . $ticket->nomor_ticket . ').');
        return redirect()->route('technician.permintaan.create');
    }
}
