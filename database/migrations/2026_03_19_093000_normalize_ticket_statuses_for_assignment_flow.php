<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('tickets')) {
            return;
        }

        DB::table('tickets')
            ->whereNull('status')
            ->update(['status' => 'CREATED']);

        DB::table('tickets')
            ->where('status', 'new')
            ->update(['status' => 'CREATED']);

        DB::table('tickets')
            ->where('status', 'NEW')
            ->update(['status' => 'CREATED']);
    }

    public function down(): void
    {
        if (!Schema::hasTable('tickets')) {
            return;
        }

        DB::table('tickets')
            ->where('status', 'CREATED')
            ->whereNull('leader_id')
            ->whereNull('technician_id')
            ->update(['status' => 'NEW']);
    }
};
