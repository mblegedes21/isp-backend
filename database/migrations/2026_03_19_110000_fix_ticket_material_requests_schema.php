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

        Schema::table('ticket_material_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('ticket_material_requests', 'technician_id')) {
                $table->unsignedBigInteger('technician_id')->nullable()->after('ticket_id');
            }
        });

        $hasForeign = collect(DB::select("SHOW CREATE TABLE ticket_material_requests"))
            ->pluck('Create Table')
            ->filter()
            ->contains(fn (string $definition) => str_contains($definition, 'technician_id'));

        if (!$hasForeign) {
            Schema::table('ticket_material_requests', function (Blueprint $table) {
                $table->foreign('technician_id')->references('id')->on('users')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('ticket_material_requests') || !Schema::hasColumn('ticket_material_requests', 'technician_id')) {
            return;
        }

        Schema::table('ticket_material_requests', function (Blueprint $table) {
            try {
                $table->dropForeign(['technician_id']);
            } catch (Throwable) {
            }
        });
    }
};
