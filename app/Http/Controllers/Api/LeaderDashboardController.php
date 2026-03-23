<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TechnicianLocationLog;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;

class LeaderDashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $leader = $request->user();
        $technicians = User::query()->where('role', User::ROLE_TEKNISI)->where('area_id', $leader?->area_id)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'leader' => [
                    'id' => $leader?->id,
                    'name' => $leader?->name,
                    'area_id' => $leader?->area_id,
                ],
                'assigned_technicians' => $technicians->map(fn (User $technician) => [
                    'id' => $technician->id,
                    'name' => $technician->name,
                    'active_tickets' => Ticket::where('technician_id', $technician->id)->whereNotIn('status', ['CLOSED', 'CLOSED_WITH_LOSS'])->count(),
                    'closed_today' => Ticket::where('technician_id', $technician->id)->whereDate('updated_at', now()->toDateString())->whereIn('status', ['CLOSED', 'CLOSED_WITH_LOSS'])->count(),
                ])->values(),
                'tickets_awaiting_review' => Ticket::where('leader_id', $leader?->id)->where('status', 'PENDING_MANAGER_REVIEW')->count(),
                'suspicious_submissions' => TechnicianLocationLog::where('area_id', $leader?->area_id)->where('needs_review', true)->count(),
                'daily_productivity' => [
                    'tickets_closed_today' => Ticket::where('leader_id', $leader?->id)->whereDate('updated_at', now()->toDateString())->whereIn('status', ['CLOSED', 'CLOSED_WITH_LOSS'])->count(),
                    'tickets_active' => Ticket::where('leader_id', $leader?->id)->whereNotIn('status', ['CLOSED', 'CLOSED_WITH_LOSS'])->count(),
                ],
            ],
        ]);
    }
}
