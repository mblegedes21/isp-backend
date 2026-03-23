<?php

namespace App\Http\Controllers\Gudang;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class GudangTransferController extends Controller
{
    /**
     * List transfers between locations
     */
    public function index()
    {
        // Placeholder for transfers
        $transfers = [];
        return view('gudang.transfer.index', compact('transfers'));
    }

    /**
     * Show transfer details
     */
    public function show($id)
    {
        // Placeholder
        $transfer = [];
        return view('gudang.transfer.show', compact('transfer'));
    }
}
