<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('stock_transactions', 'branch_id')) {
                $table->foreignId('branch_id')->nullable()->after('material_id')->constrained('branches')->nullOnDelete();
            }

            if (!Schema::hasColumn('stock_transactions', 'reference_type')) {
                $table->string('reference_type', 120)->nullable()->after('total_price');
            }

            if (!Schema::hasColumn('stock_transactions', 'reference_id')) {
                $table->string('reference_id', 120)->nullable()->after('reference_type');
            }

            if (!Schema::hasColumn('stock_transactions', 'notes')) {
                $table->text('notes')->nullable()->after('reference_id');
            }

            if (!Schema::hasColumn('stock_transactions', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
            }

            $table->index(['branch_id', 'material_id'], 'stock_transactions_branch_material_idx');
        });

        DB::table('stock_transactions')
            ->whereNull('created_by')
            ->update(['created_by' => DB::raw('user_id')]);

        DB::statement("ALTER TABLE stock_transactions MODIFY type ENUM('OUT', 'IN', 'TRANSFER', 'RETURN', 'LOSS', 'AUDIT_ADJUSTMENT') NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE stock_transactions MODIFY type ENUM('OUT', 'IN', 'TRANSFER', 'LOSS') NULL");

        Schema::table('stock_transactions', function (Blueprint $table) {
            $table->dropIndex('stock_transactions_branch_material_idx');

            if (Schema::hasColumn('stock_transactions', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }
        });
    }
};
