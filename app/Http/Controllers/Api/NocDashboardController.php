<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NocDashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Ticket::query();

        if ($user && $user->isNoc()) {
            $query->where('created_by', $user->id);
        }

        $totalTickets = (clone $query)->count();
        $openTickets = (clone $query)->whereIn('status', ['CREATED', 'ASSIGNED', 'MATERIAL_PREPARED', 'IN_PROGRESS'])->count();
        $resolvedTickets = (clone $query)->whereIn('status', ['COMPLETED', 'CLOSED', 'CLOSED_WITH_LOSS'])->count();
        $escalatedTickets = (clone $query)->where('status', 'ESCALATED')->count();

        return response()->json([
            'success' => true,
            'message' => 'NOC dashboard loaded.',
            'data' => [
                'total_tickets' => $totalTickets,
                'open_tickets' => $openTickets,
                'resolved_tickets' => $resolvedTickets,
                'escalated_tickets' => $escalatedTickets,
            ],
        ]);
    }
}
