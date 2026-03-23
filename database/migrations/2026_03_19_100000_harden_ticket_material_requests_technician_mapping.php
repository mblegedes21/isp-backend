<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('ticket_material_requests')) {
            return;
        }

        if (!Schema::hasColumn('ticket_material_requests', 'technician_id')) {
            Schema::table('ticket_material_requests', function (Blueprint $table) {
                $table->foreignId('technician_id')->nullable()->after('ticket_id')->constrained('users')->nullOnDelete();
            });
        }

        $legacyRows = DB::table('ticket_material_requests')
            ->select('id', 'ticket_id')
            ->whereNull('technician_id')
            ->get();

        foreach ($legacyRows as $row) {
            $ticketTechnicianId = DB::table('tickets')
                ->where('id', $row->ticket_id)
                ->value('technician_id');

            if ($ticketTechnicianId) {
                DB::table('ticket_material_requests')
                    ->where('id', $row->id)
                    ->update(['technician_id' => $ticketTechnicianId]);
            }
        }

        DB::table('ticket_material_requests')
            ->whereNull('technician_id')
            ->delete();

        $this->ensureIndex('ticket_material_requests', 'ticket_material_requests_ticket_technician_hardened_idx', ['ticket_id', 'technician_id']);
    }

    public function down(): void
    {
        if (!Schema::hasTable('ticket_material_requests')) {
            return;
        }

        Schema::table('ticket_material_requests', function (Blueprint $table) {
            if ($this->indexExists('ticket_material_requests', 'ticket_material_requests_ticket_technician_hardened_idx')) {
                $table->dropIndex('ticket_material_requests_ticket_technician_hardened_idx');
            }
        });
    }

    private function ensureIndex(string $table, string $indexName, array $columns): void
    {
        if ($this->indexExists($table, $indexName)) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) use ($columns, $indexName) {
            $blueprint->index($columns, $indexName);
        });
    }

    private function indexExists(string $table, string $indexName): bool
    {
        try {
            return collect(DB::select("SHOW INDEX FROM {$table}"))->contains(
                fn (object $index) => ($index->Key_name ?? null) === $indexName
            );
        } catch (Throwable) {
            return false;
        }
    }
};
