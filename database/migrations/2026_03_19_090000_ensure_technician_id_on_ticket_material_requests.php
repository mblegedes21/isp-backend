<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('ticket_material_requests') || Schema::hasColumn('ticket_material_requests', 'technician_id')) {
            return;
        }

        Schema::table('ticket_material_requests', function (Blueprint $table) {
            $table->unsignedBigInteger('technician_id')->nullable()->after('ticket_id');
            $table->foreign('technician_id')->references('id')->on('users')->nullOnDelete();
            $table->index(['ticket_id', 'technician_id'], 'ticket_material_requests_ticket_technician_idx');
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('ticket_material_requests') || !Schema::hasColumn('ticket_material_requests', 'technician_id')) {
            return;
        }

        Schema::table('ticket_material_requests', function (Blueprint $table) {
            $table->dropIndex('ticket_material_requests_ticket_technician_idx');
            $table->dropForeign(['technician_id']);
            $table->dropColumn('technician_id');
        });
    }
};
