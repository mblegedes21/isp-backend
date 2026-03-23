<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\Attendance;
use App\Models\Branch;
use App\Models\Escalation;
use App\Models\Material;
use App\Models\StockTransaction;
use App\Models\Ticket;

class OwnerDashboardController extends Controller
{
    public function __invoke()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'branches' => [
                    'total' => Branch::count(),
                    'active' => Branch::where('is_active', true)->count(),
                ],
                'areas' => [
                    'total' => Area::count(),
                    'active' => Area::where('is_active', true)->count(),
                ],
                'tickets' => [
                    'total' => Ticket::count(),
                    'open' => Ticket::whereNotIn('status', ['CLOSED', 'CLOSED_WITH_LOSS'])->count(),
                    'closed_today' => Ticket::whereDate('updated_at', now()->toDateString())->whereIn('status', ['CLOSED', 'CLOSED_WITH_LOSS'])->count(),
                    'escalated' => Escalation::count(),
                ],
                'productivity' => [
                    'attendance_today' => Attendance::whereDate('date', now()->toDateString())->count(),
                    'tickets_per_branch' => Branch::query()->get(['id', 'name'])->map(fn (Branch $branch) => [
                        'branch_id' => $branch->id,
                        'branch_name' => $branch->name,
                        'ticket_total' => Ticket::where('branch_id', $branch->id)->count(),
                        'ticket_closed' => Ticket::where('branch_id', $branch->id)->whereIn('status', ['CLOSED', 'CLOSED_WITH_LOSS'])->count(),
                    ])->values(),
                ],
                'stock' => [
                    'materials' => Material::count(),
                    'low_stock' => Material::whereColumn('stock', '<=', 'minimum_stock')->count(),
                    'transactions_today' => StockTransaction::whereDate('created_at', now()->toDateString())->count(),
                ],
            ],
        ]);
    }
}
