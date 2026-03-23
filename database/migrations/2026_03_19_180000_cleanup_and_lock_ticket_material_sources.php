<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('ticket_materials') && !Schema::hasColumn('ticket_materials', 'source_type')) {
            Schema::table('ticket_materials', function (Blueprint $table) {
                $table->string('source_type', 40)->nullable()->after('quantity');
            });
        }

        if (!Schema::hasTable('ticket_materials') || !Schema::hasTable('ticket_material_requests')) {
            return;
        }

        DB::transaction(function () {
            DB::table('ticket_materials')
                ->whereNull('source_type')
                ->update(['source_type' => 'LEADER_ASSIGNMENT']);

            $leaderRequests = DB::table('ticket_material_requests')
                ->select('id', 'ticket_id', 'material_id', 'teknisi_id', 'technician_id', 'quantity')
                ->whereIn('requested_role', ['LEADER', 'MANAGER', 'NOC'])
                ->orderBy('id')
                ->get();

            foreach ($leaderRequests as $request) {
                $teknisiId = (int) ($request->teknisi_id ?: $request->technician_id);

                if ($teknisiId <= 0) {
                    continue;
                }

                $existing = DB::table('ticket_materials')
                    ->where('ticket_id', $request->ticket_id)
                    ->where('material_id', $request->material_id)
                    ->where(function ($query) use ($teknisiId) {
                        $query->where('teknisi_id', $teknisiId)
                            ->orWhere('technician_id', $teknisiId);
                    })
                    ->where('source_type', 'LEADER_ASSIGNMENT')
                    ->first();

                if ($existing) {
                    DB::table('ticket_materials')
                        ->where('id', $existing->id)
                        ->update([
                            'quantity' => max((int) $existing->quantity, (int) $request->quantity),
                            'qty' => max((int) $existing->qty, (int) $request->quantity),
                            'source_type' => 'LEADER_ASSIGNMENT',
                        ]);
                } else {
                    $ticketRow = DB::table('tickets')->select('branch_id', 'area_id')->where('id', $request->ticket_id)->first();

                    DB::table('ticket_materials')->insert([
                        'ticket_id' => $request->ticket_id,
                        'branch_id' => $ticketRow?->branch_id,
                        'area_id' => $ticketRow?->area_id,
                        'material_id' => $request->material_id,
                        'teknisi_id' => $teknisiId,
                        'technician_id' => $teknisiId,
                        'quantity' => (int) $request->quantity,
                        'qty' => (int) $request->quantity,
                        'product_id' => $request->material_id,
                        'source_type' => 'LEADER_ASSIGNMENT',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                DB::table('ticket_material_requests')->where('id', $request->id)->delete();
            }

            $technicianRequests = DB::table('ticket_material_requests')
                ->select('id', 'ticket_id', 'material_id', 'teknisi_id', 'technician_id', 'created_at')
                ->where('requested_role', 'TEKNISI')
                ->get();

            foreach ($technicianRequests as $request) {
                $teknisiId = (int) ($request->teknisi_id ?: $request->technician_id);

                if ($teknisiId <= 0) {
                    continue;
                }

                DB::table('ticket_materials')
                    ->where('ticket_id', $request->ticket_id)
                    ->where('material_id', $request->material_id)
                    ->where(function ($query) use ($teknisiId) {
                        $query->where('teknisi_id', $teknisiId)
                            ->orWhere('technician_id', $teknisiId);
                    })
                    ->where(function ($query) use ($request) {
                        $query->where('source_type', 'TECHNICIAN_REQUEST')
                            ->orWhere(function ($nested) use ($request) {
                                $nested->whereNull('source_type')
                                    ->where('created_at', '>=', $request->created_at);
                            });
                    })
                    ->delete();
            }

            $duplicates = DB::table('ticket_materials')
                ->select(
                    'ticket_id',
                    'material_id',
                    DB::raw('COALESCE(teknisi_id, technician_id) as teknisi_id'),
                    'source_type',
                    DB::raw('MIN(id) as keeper_id'),
                    DB::raw('SUM(COALESCE(quantity, qty, 0)) as total_quantity'),
                    DB::raw('COUNT(*) as total_rows')
                )
                ->groupBy('ticket_id', 'material_id', DB::raw('COALESCE(teknisi_id, technician_id)'), 'source_type')
                ->havingRaw('COUNT(*) > 1')
                ->get();

            foreach ($duplicates as $duplicate) {
                DB::table('ticket_materials')
                    ->where('id', $duplicate->keeper_id)
                    ->update([
                        'quantity' => (int) $duplicate->total_quantity,
                        'qty' => (int) $duplicate->total_quantity,
                        'source_type' => $duplicate->source_type ?: 'LEADER_ASSIGNMENT',
                    ]);

                DB::table('ticket_materials')
                    ->where('ticket_id', $duplicate->ticket_id)
                    ->where('material_id', $duplicate->material_id)
                    ->where(function ($query) use ($duplicate) {
                        $query->where('teknisi_id', $duplicate->teknisi_id)
                            ->orWhere('technician_id', $duplicate->teknisi_id);
                    })
                    ->where('id', '!=', $duplicate->keeper_id)
                    ->delete();
            }
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('ticket_materials') && Schema::hasColumn('ticket_materials', 'source_type')) {
            Schema::table('ticket_materials', function (Blueprint $table) {
                $table->dropColumn('source_type');
            });
        }
    }
};
