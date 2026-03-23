<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('materials', function (Blueprint $table) {
            if (!Schema::hasColumn('materials', 'brand')) {
                $table->string('brand', 120)->nullable()->after('brand_id');
            }

            if (!Schema::hasColumn('materials', 'purchase_price')) {
                $table->decimal('purchase_price', 15, 2)->default(0)->after('minimum_stock');
            }

            $table->index(['brand', 'category_id'], 'materials_brand_category_idx');
        });

        DB::table('materials')
            ->leftJoin('material_brands', 'materials.brand_id', '=', 'material_brands.id')
            ->update(['materials.brand' => DB::raw('material_brands.name')]);

        Schema::table('stock_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('stock_transactions', 'transaction_type')) {
                $table->string('transaction_type', 20)->nullable()->after('branch_id');
            }

            if (!Schema::hasColumn('stock_transactions', 'unit_price')) {
                $table->decimal('unit_price', 15, 2)->default(0)->after('quantity');
            }

            if (!Schema::hasColumn('stock_transactions', 'total_price')) {
                $table->decimal('total_price', 15, 2)->default(0)->after('unit_price');
            }

            $table->index(['transaction_type', 'created_at'], 'stock_transactions_type_created_idx');
        });

        DB::table('stock_transactions')->whereNull('transaction_type')->update([
            'transaction_type' => DB::raw("
                CASE
                    WHEN type IN ('TRANSFER_OUT', 'TRANSFER_IN', 'TRANSFER') THEN 'TRANSFER'
                    ELSE type
                END
            "),
        ]);

        Schema::table('loss_reports', function (Blueprint $table) {
            if (!Schema::hasColumn('loss_reports', 'unit_price')) {
                $table->decimal('unit_price', 15, 2)->default(0)->after('quantity');
            }

            if (!Schema::hasColumn('loss_reports', 'total_price')) {
                $table->decimal('total_price', 15, 2)->default(0)->after('unit_price');
            }
        });
    }

    public function down(): void
    {
        Schema::table('loss_reports', function (Blueprint $table) {
            if (Schema::hasColumn('loss_reports', 'unit_price')) {
                $table->dropColumn(['unit_price', 'total_price']);
            }
        });

        Schema::table('stock_transactions', function (Blueprint $table) {
            if (Schema::hasColumn('stock_transactions', 'transaction_type')) {
                $table->dropIndex('stock_transactions_type_created_idx');
                $table->dropColumn(['transaction_type', 'unit_price', 'total_price']);
            }
        });

        Schema::table('materials', function (Blueprint $table) {
            if (Schema::hasColumn('materials', 'brand')) {
                $table->dropIndex('materials_brand_category_idx');
                $table->dropColumn(['brand', 'purchase_price']);
            }
        });
    }
};
