<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ApprovalsController extends Controller
{
    public function index()
    {
        $approvals = [
            ['id' => 201, 'ticket' => 'TCK-2026-010', 'requester' => 'Ayu', 'date' => '2026-02-22', 'status' => 'Pending'],
            ['id' => 202, 'ticket' => 'TCK-2026-011', 'requester' => 'Rafi', 'date' => '2026-02-20', 'status' => 'Pending'],
        ];
        return view('approvals.index', compact('approvals'));
    }

    public function show($id)
    {
        $request = ['id' => $id, 'ticket' => 'TCK-2026-0' . $id, 'requester' => 'Ayu', 'details' => 'Sample request details', 'status' => 'Pending'];
        return view('approvals.show', compact('request'));
    }
}
