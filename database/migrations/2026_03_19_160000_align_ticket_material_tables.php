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
                if (!Schema::hasColumn('ticket_materials', 'material_id')) {
                    $table->foreignId('material_id')->nullable()->after('area_id')->constrained('materials')->nullOnDelete();
                }

                if (!Schema::hasColumn('ticket_materials', 'technician_id')) {
                    $table->foreignId('technician_id')->nullable()->after('material_id')->constrained('users')->nullOnDelete();
                }

                if (!Schema::hasColumn('ticket_materials', 'quantity')) {
                    $table->unsignedInteger('quantity')->default(0)->after('technician_id');
                }
            });

            if (Schema::hasColumn('ticket_materials', 'product_id')) {
                DB::table('ticket_materials')
                    ->whereNull('material_id')
                    ->update(['material_id' => DB::raw('product_id')]);
            }

            if (Schema::hasColumn('ticket_materials', 'qty')) {
                DB::table('ticket_materials')
                    ->where('quantity', 0)
                    ->update(['quantity' => DB::raw('qty')]);
            }
        }

        if (Schema::hasTable('ticket_material_requests')) {
            Schema::table('ticket_material_requests', function (Blueprint $table) {
                if (!Schema::hasColumn('ticket_material_requests', 'technician_id')) {
                    $table->foreignId('technician_id')->nullable()->after('material_id')->constrained('users')->nullOnDelete();
                }

                if (!Schema::hasColumn('ticket_material_requests', 'status')) {
                    $table->string('status', 32)->default('PENDING')->after('quantity');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('ticket_materials')) {
            Schema::table('ticket_materials', function (Blueprint $table) {
                if (Schema::hasColumn('ticket_materials', 'quantity')) {
                    $table->dropColumn('quantity');
                }

                if (Schema::hasColumn('ticket_materials', 'technician_id')) {
                    $table->dropConstrainedForeignId('technician_id');
                }

                if (Schema::hasColumn('ticket_materials', 'material_id')) {
                    $table->dropConstrainedForeignId('material_id');
                }
            });
        }
    }
};
