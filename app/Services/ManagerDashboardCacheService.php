<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\AttendanceFlag;
use App\Models\Area;
use App\Models\Escalation;
use App\Models\StockTransaction;
use App\Models\TechnicianLocationLog;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class ManagerDashboardCacheService
{
    public function summary(): array
    {
        $store = Cache::store(config('operations.cache_store', 'redis'));

        return [
            'tickets' => $store->remember(
                'manager:dashboard:tickets',
                now()->addSeconds((int) config('operations.cache_ttl.ticket_counters', 5)),
                fn () => [
                    'total' => Ticket::count(),
                    'active' => Ticket::whereNotIn('status', ['CLOSED', 'CLOSED_WITH_LOSS'])->count(),
                    'escalated' => Ticket::where('status', 'ESCALATED')->count(),
                    'pending_manager_review' => Ticket::where('status', 'PENDING_MANAGER_REVIEW')->count(),
                ]
            ),
            'attendance' => $store->remember(
                'manager:dashboard:attendance',
                now()->addSeconds((int) config('operations.cache_ttl.ticket_counters', 5)),
                fn () => [
                    'total_today' => Attendance::whereDate('date', now()->toDateString())->count(),
                    'flagged_today' => Attendance::whereDate('date', now()->toDateString())->where('flagged', true)->count(),
                    'flagged_all_time' => Attendance::where('flagged', true)->count(),
                    'attendance_flags_open' => AttendanceFlag::where('status', '!=', 'SELESAI')->count(),
                ]
            ),
            'inventory' => $store->remember(
                'manager:dashboard:inventory',
                now()->addSeconds((int) config('operations.cache_ttl.area_summaries', 10)),
                fn () => [
                    'loss_transactions' => StockTransaction::where('type', 'LOSS')->count(),
                    'transfer_transactions' => StockTransaction::whereIn('type', ['TRANSFER_OUT', 'TRANSFER_IN'])->count(),
                ]
            ),
            'areas' => $store->remember(
                'manager:dashboard:areas',
                now()->addSeconds((int) config('operations.cache_ttl.area_summaries', 10)),
                fn () => [
                    'total' => Area::count(),
                    'active' => Area::where('is_active', true)->count(),
                    'inactive' => Area::where('is_active', false)->count(),
                ]
            ),
            'escalation' => $store->remember(
                'manager:dashboard:escalation',
                now()->addSeconds((int) config('operations.cache_ttl.technician_stats', 15)),
                fn () => [
                    'total' => Escalation::count(),
                    'today' => Escalation::whereDate('created_at', now()->toDateString())->count(),
                    'suspicious_locations' => TechnicianLocationLog::where('needs_review', true)->count(),
                    'active_technicians' => User::where('role', User::ROLE_TEKNISI)->count(),
                ]
            ),
        ];
    }
}
