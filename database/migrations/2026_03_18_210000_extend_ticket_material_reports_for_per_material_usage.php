<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ticket_material_reports', function (Blueprint $table) {
            if (!Schema::hasColumn('ticket_material_reports', 'material_id')) {
                $table->foreignId('material_id')->nullable()->after('technician_id')->constrained('materials')->nullOnDelete();
            }

            if (!Schema::hasColumn('ticket_material_reports', 'quantity_used')) {
                $table->unsignedInteger('quantity_used')->default(0)->after('material_remaining');
            }

            if (!Schema::hasColumn('ticket_material_reports', 'quantity_remaining')) {
                $table->unsignedInteger('quantity_remaining')->default(0)->after('quantity_used');
            }

            if (!Schema::hasColumn('ticket_material_reports', 'photo_path')) {
                $table->string('photo_path')->nullable()->after('quantity_remaining');
            }

            if (!Schema::hasColumn('ticket_material_reports', 'photo_temp_path')) {
                $table->string('photo_temp_path')->nullable()->after('photo_path');
            }
        });

        $this->ensureIndex('ticket_material_reports', 'ticket_material_reports_ticket_id_index', ['ticket_id']);
        $this->ensureIndex('ticket_material_reports', 'ticket_material_reports_technician_id_index', ['technician_id']);

        Schema::table('ticket_material_reports', function (Blueprint $table) {
            if ($this->indexExists('ticket_material_reports', 'ticket_material_reports_ticket_id_technician_id_unique')) {
                $table->dropUnique('ticket_material_reports_ticket_id_technician_id_unique');
            }

            if (!$this->indexExists('ticket_material_reports', 'ticket_material_reports_ticket_technician_material_unique')) {
                $table->unique(['ticket_id', 'technician_id', 'material_id'], 'ticket_material_reports_ticket_technician_material_unique');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ticket_material_reports', function (Blueprint $table) {
            if ($this->indexExists('ticket_material_reports', 'ticket_material_reports_ticket_technician_material_unique')) {
                $table->dropUnique('ticket_material_reports_ticket_technician_material_unique');
            }

            if (!$this->indexExists('ticket_material_reports', 'ticket_material_reports_ticket_id_technician_id_unique')) {
                $table->unique(['ticket_id', 'technician_id']);
            }

            if (Schema::hasColumn('ticket_material_reports', 'material_id')) {
                $table->dropConstrainedForeignId('material_id');
            }

            $dropColumns = collect(['quantity_used', 'quantity_remaining', 'photo_path', 'photo_temp_path'])
                ->filter(fn (string $column) => Schema::hasColumn('ticket_material_reports', $column))
                ->values()
                ->all();

            if ($dropColumns !== []) {
                $table->dropColumn($dropColumns);
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
        return collect(DB::select("SHOW INDEX FROM {$table}"))->contains(
            fn (object $index) => ($index->Key_name ?? null) === $indexName
        );
    }
};
