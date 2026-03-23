<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TechnicianIncentiveController extends Controller
{
    private const BONUS_RATES = [
        'PEMASANGAN_BARU' => 50000,
        'MAINTENANCE' => 20000,
        'TARIK_KABEL' => 30000,
    ];

    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();

        $tickets = $this->completedTicketsQuery((int) $user->id);
        $pemasangan = (clone $tickets)->whereIn('status', ['DONE', 'COMPLETED', 'CLOSED', 'CLOSED_WITH_LOSS'])->get()->filter(
            fn (Ticket $ticket) => $this->normalizeType($ticket) === 'PEMASANGAN_BARU'
        )->count();
        $maintenance = (clone $tickets)->whereIn('status', ['DONE', 'COMPLETED', 'CLOSED', 'CLOSED_WITH_LOSS'])->get()->filter(
            fn (Ticket $ticket) => $this->normalizeType($ticket) === 'MAINTENANCE'
        )->count();
        $tarik = (clone $tickets)->whereIn('status', ['DONE', 'COMPLETED', 'CLOSED', 'CLOSED_WITH_LOSS'])->get()->filter(
            fn (Ticket $ticket) => $this->normalizeType($ticket) === 'TARIK_KABEL'
        )->count();

        $totalBonus =
            ($pemasangan * self::BONUS_RATES['PEMASANGAN_BARU']) +
            ($maintenance * self::BONUS_RATES['MAINTENANCE']) +
            ($tarik * self::BONUS_RATES['TARIK_KABEL']);

        return response()->json([
            'user_role' => $user?->role,
            'pemasangan_baru' => $pemasangan,
            'maintenance' => $maintenance,
            'tarik_kabel' => $tarik,
            'total_bonus' => $totalBonus,
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        $user = $request->user();

        $rows = $this->completedTicketsQuery((int) $user->id)
            ->latest('updated_at')
            ->get()
            ->map(function (Ticket $ticket) {
                $type = $this->normalizeType($ticket);
                $bonus = self::BONUS_RATES[$type] ?? 0;

                return [
                    'id' => (string) $ticket->id,
                    'ticket' => $ticket->nomor_ticket ?: (string) $ticket->id,
                    'title' => $ticket->title,
                    'type' => $type,
                    'bonus_per_item' => $bonus,
                    'total_bonus' => $bonus,
                    'pemasangan_baru' => $type === 'PEMASANGAN_BARU' ? 1 : 0,
                    'maintenance' => $type === 'MAINTENANCE' ? 1 : 0,
                    'tarik_kabel' => $type === 'TARIK_KABEL' ? 1 : 0,
                    'status' => $ticket->status,
                    'updated_at' => $ticket->updated_at?->toIso8601String(),
                ];
            })
            ->values();

        return response()->json([
            'user_role' => $user?->role,
            'data' => $rows,
        ]);
    }

    private function completedTicketsQuery(int $userId)
    {
        return Ticket::query()
            ->where('technician_id', $userId)
            ->whereIn('status', ['DONE', 'COMPLETED', 'CLOSED', 'CLOSED_WITH_LOSS']);
    }

    private function normalizeType(Ticket $ticket): string
    {
        $raw = strtoupper(str_replace([' ', '-'], '_', (string) ($ticket->jenis_pekerjaan ?: $ticket->problem_type ?: '')));

        if (str_contains($raw, 'MAINT')) {
            return 'MAINTENANCE';
        }

        if (str_contains($raw, 'PASANG') || str_contains($raw, 'BARU') || str_contains($raw, 'INSTALL')) {
            return 'PEMASANGAN_BARU';
        }

        return 'TARIK_KABEL';
    }
}
