<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('ticket_materials')) {
            Schema::table('ticket_materials', function (Blueprint $table) {
                if (!Schema::hasColumn('ticket_materials', 'teknisi_id')) {
                    $table->foreignId('teknisi_id')->nullable()->after('material_id')->constrained('users')->nullOnDelete();
                }
            });

            if (Schema::hasColumn('ticket_materials', 'technician_id')) {
                DB::table('ticket_materials')
                    ->whereNull('teknisi_id')
                    ->update(['teknisi_id' => DB::raw('technician_id')]);
            }
        }

        if (Schema::hasTable('ticket_material_requests')) {
            Schema::table('ticket_material_requests', function (Blueprint $table) {
                if (!Schema::hasColumn('ticket_material_requests', 'teknisi_id')) {
                    $table->foreignId('teknisi_id')->nullable()->after('material_id')->constrained('users')->nullOnDelete();
                }
            });

            if (Schema::hasColumn('ticket_material_requests', 'technician_id')) {
                DB::table('ticket_material_requests')
                    ->whereNull('teknisi_id')
                    ->update(['teknisi_id' => DB::raw('technician_id')]);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('ticket_material_requests') && Schema::hasColumn('ticket_material_requests', 'teknisi_id')) {
            Schema::table('ticket_material_requests', function (Blueprint $table) {
                $table->dropConstrainedForeignId('teknisi_id');
            });
        }

        if (Schema::hasTable('ticket_materials') && Schema::hasColumn('ticket_materials', 'teknisi_id')) {
            Schema::table('ticket_materials', function (Blueprint $table) {
                $table->dropConstrainedForeignId('teknisi_id');
            });
        }
    }
};
