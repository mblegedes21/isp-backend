<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('tickets') || !Schema::hasColumn('tickets', 'technician_id')) {
            return;
        }

        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        Schema::table('tickets', function ($table) {
            $table->dropForeign(['technician_id']);
        });

        DB::statement('ALTER TABLE tickets MODIFY technician_id BIGINT UNSIGNED NULL');

        Schema::table('tickets', function ($table) {
            $table->foreign('technician_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('tickets') || !Schema::hasColumn('tickets', 'technician_id')) {
            return;
        }

        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        $nullTicketExists = DB::table('tickets')->whereNull('technician_id')->exists();
        if ($nullTicketExists) {
            throw new RuntimeException('Cannot revert tickets.technician_id to NOT NULL while unassigned tickets still exist.');
        }

        Schema::table('tickets', function ($table) {
            $table->dropForeign(['technician_id']);
        });

        DB::statement('ALTER TABLE tickets MODIFY technician_id BIGINT UNSIGNED NOT NULL');

        Schema::table('tickets', function ($table) {
            $table->foreign('technician_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
