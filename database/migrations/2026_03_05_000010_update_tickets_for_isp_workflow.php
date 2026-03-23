<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            if (!Schema::hasColumn('tickets', 'title')) {
                $table->string('title')->nullable()->after('id');
            }

            if (!Schema::hasColumn('tickets', 'description')) {
                $table->text('description')->nullable()->after('title');
            }

            if (!Schema::hasColumn('tickets', 'area_id')) {
                $table->foreignId('area_id')->nullable()->after('description')->constrained('areas')->nullOnDelete();
            }

            if (!Schema::hasColumn('tickets', 'problem_type')) {
                $table->string('problem_type')->nullable()->after('area_id');
            }

            if (!Schema::hasColumn('tickets', 'priority')) {
                $table->enum('priority', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])->default('MEDIUM')->after('problem_type');
            }

            if (!Schema::hasColumn('tickets', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('technician_id')->constrained('users')->nullOnDelete();
            }

            if (!Schema::hasColumn('tickets', 'escalated_at')) {
                $table->timestamp('escalated_at')->nullable()->after('status');
            }

        });

        DB::table('tickets')->where('status', 'active')->update(['status' => 'IN_PROGRESS']);
        DB::table('tickets')->where('status', 'closed')->update(['status' => 'CLOSED']);

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE tickets MODIFY status ENUM('CREATED','ASSIGNED','MATERIAL_PREPARED','IN_PROGRESS','ESCALATED','COMPLETED','PENDING_MANAGER_REVIEW','CLOSED','CLOSED_WITH_LOSS') NOT NULL DEFAULT 'CREATED'");
        }
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            if (Schema::hasColumn('tickets', 'escalated_at')) {
                $table->dropColumn('escalated_at');
            }

            if (Schema::hasColumn('tickets', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }

            if (Schema::hasColumn('tickets', 'priority')) {
                $table->dropColumn('priority');
            }

            if (Schema::hasColumn('tickets', 'problem_type')) {
                $table->dropColumn('problem_type');
            }

            if (Schema::hasColumn('tickets', 'area_id')) {
                $table->dropConstrainedForeignId('area_id');
            }

            if (Schema::hasColumn('tickets', 'description')) {
                $table->dropColumn('description');
            }

            if (Schema::hasColumn('tickets', 'title')) {
                $table->dropColumn('title');
            }
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE tickets MODIFY status ENUM('active','closed') NOT NULL DEFAULT 'active'");
        }
    }
};
