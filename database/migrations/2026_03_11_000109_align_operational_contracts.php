<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'category')) {
                $table->string('category', 80)->nullable()->after('sku');
            }

            if (!Schema::hasColumn('products', 'description')) {
                $table->text('description')->nullable()->after('is_active');
            }

            $table->index(['category', 'branch_id'], 'products_category_branch_idx');
        });

        Schema::table('attendances', function (Blueprint $table) {
            if (!Schema::hasColumn('attendances', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable()->after('check_out');
            }

            if (!Schema::hasColumn('attendances', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            }

            if (!Schema::hasColumn('attendances', 'accuracy')) {
                $table->decimal('accuracy', 8, 2)->nullable()->after('longitude');
            }

            if (!Schema::hasColumn('attendances', 'photo_path')) {
                $table->string('photo_path')->nullable()->after('accuracy');
            }

            $table->index(['branch_id', 'date', 'user_id'], 'attendance_branch_date_user_idx');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropIndex('attendance_branch_date_user_idx');

            if (Schema::hasColumn('attendances', 'photo_path')) {
                $table->dropColumn(['latitude', 'longitude', 'accuracy', 'photo_path']);
            }
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_category_branch_idx');

            if (Schema::hasColumn('products', 'category')) {
                $table->dropColumn(['category', 'description']);
            }
        });
    }
};
