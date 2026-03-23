<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('areas', function (Blueprint $table) {
            if (!Schema::hasColumn('areas', 'branch_id')) {
                $table->foreignId('branch_id')->nullable()->after('id')->constrained('branches')->nullOnDelete();
            }

            $table->index(['branch_id', 'is_active']);
            $table->index(['code', 'branch_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'branch_id')) {
                $table->foreignId('branch_id')->nullable()->after('id')->constrained('branches')->nullOnDelete();
            }

            if (!Schema::hasColumn('users', 'area_id')) {
                $table->foreignId('area_id')->nullable()->after('branch_id')->constrained('areas')->nullOnDelete();
            }

            $table->index(['branch_id', 'role']);
            $table->index(['area_id', 'role']);
        });

        Schema::table('tickets', function (Blueprint $table) {
            if (!Schema::hasColumn('tickets', 'branch_id')) {
                $table->foreignId('branch_id')->nullable()->after('area_id')->constrained('branches')->nullOnDelete();
            }

            $table->index(['branch_id', 'area_id', 'status']);
            $table->index(['branch_id', 'priority', 'status']);
            $table->index(['leader_id', 'status', 'updated_at']);
            $table->index(['technician_id', 'status', 'updated_at']);
            $table->index(['created_at', 'updated_at']);
        });

        Schema::table('ticket_materials', function (Blueprint $table) {
            if (!Schema::hasColumn('ticket_materials', 'branch_id')) {
                $table->foreignId('branch_id')->nullable()->after('ticket_id')->constrained('branches')->nullOnDelete();
            }

            if (!Schema::hasColumn('ticket_materials', 'area_id')) {
                $table->foreignId('area_id')->nullable()->after('branch_id')->constrained('areas')->nullOnDelete();
            }

            $table->index(['branch_id', 'area_id', 'created_at']);
        });

        Schema::table('ticket_progress', function (Blueprint $table) {
            if (!Schema::hasColumn('ticket_progress', 'branch_id')) {
                $table->foreignId('branch_id')->nullable()->after('ticket_id')->constrained('branches')->nullOnDelete();
            }

            if (!Schema::hasColumn('ticket_progress', 'area_id')) {
                $table->foreignId('area_id')->nullable()->after('branch_id')->constrained('areas')->nullOnDelete();
            }

            $table->index(['branch_id', 'area_id', 'created_at']);
        });

        Schema::table('attendances', function (Blueprint $table) {
            if (!Schema::hasColumn('attendances', 'branch_id')) {
                $table->foreignId('branch_id')->nullable()->after('user_id')->constrained('branches')->nullOnDelete();
            }

            if (!Schema::hasColumn('attendances', 'area_id')) {
                $table->foreignId('area_id')->nullable()->after('branch_id')->constrained('areas')->nullOnDelete();
            }

            $table->index(['branch_id', 'area_id', 'date']);
            $table->index(['flagged', 'date']);
        });

        Schema::table('escalations', function (Blueprint $table) {
            if (!Schema::hasColumn('escalations', 'branch_id')) {
                $table->foreignId('branch_id')->nullable()->after('ticket_id')->constrained('branches')->nullOnDelete();
            }

            if (!Schema::hasColumn('escalations', 'area_id')) {
                $table->foreignId('area_id')->nullable()->after('branch_id')->constrained('areas')->nullOnDelete();
            }

            $table->index(['branch_id', 'area_id', 'created_at']);
        });

        Schema::table('stock_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('stock_transactions', 'branch_id')) {
                $table->foreignId('branch_id')->nullable()->after('material_id')->constrained('branches')->nullOnDelete();
            }

            $table->index(['branch_id', 'area_id', 'type', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('stock_transactions', function (Blueprint $table) {
            $table->dropIndex(['branch_id', 'area_id', 'type', 'created_at']);
            if (Schema::hasColumn('stock_transactions', 'branch_id')) {
                $table->dropConstrainedForeignId('branch_id');
            }
        });

        Schema::table('escalations', function (Blueprint $table) {
            $table->dropIndex(['branch_id', 'area_id', 'created_at']);
            if (Schema::hasColumn('escalations', 'area_id')) {
                $table->dropConstrainedForeignId('area_id');
            }
            if (Schema::hasColumn('escalations', 'branch_id')) {
                $table->dropConstrainedForeignId('branch_id');
            }
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropIndex(['branch_id', 'area_id', 'date']);
            $table->dropIndex(['flagged', 'date']);
            if (Schema::hasColumn('attendances', 'area_id')) {
                $table->dropConstrainedForeignId('area_id');
            }
            if (Schema::hasColumn('attendances', 'branch_id')) {
                $table->dropConstrainedForeignId('branch_id');
            }
        });

        Schema::table('ticket_progress', function (Blueprint $table) {
            $table->dropIndex(['branch_id', 'area_id', 'created_at']);
            if (Schema::hasColumn('ticket_progress', 'area_id')) {
                $table->dropConstrainedForeignId('area_id');
            }
            if (Schema::hasColumn('ticket_progress', 'branch_id')) {
                $table->dropConstrainedForeignId('branch_id');
            }
        });

        Schema::table('ticket_materials', function (Blueprint $table) {
            $table->dropIndex(['branch_id', 'area_id', 'created_at']);
            if (Schema::hasColumn('ticket_materials', 'area_id')) {
                $table->dropConstrainedForeignId('area_id');
            }
            if (Schema::hasColumn('ticket_materials', 'branch_id')) {
                $table->dropConstrainedForeignId('branch_id');
            }
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex(['branch_id', 'area_id', 'status']);
            $table->dropIndex(['branch_id', 'priority', 'status']);
            $table->dropIndex(['leader_id', 'status', 'updated_at']);
            $table->dropIndex(['technician_id', 'status', 'updated_at']);
            $table->dropIndex(['created_at', 'updated_at']);
            if (Schema::hasColumn('tickets', 'branch_id')) {
                $table->dropConstrainedForeignId('branch_id');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['branch_id', 'role']);
            $table->dropIndex(['area_id', 'role']);
            if (Schema::hasColumn('users', 'area_id')) {
                $table->dropConstrainedForeignId('area_id');
            }
            if (Schema::hasColumn('users', 'branch_id')) {
                $table->dropConstrainedForeignId('branch_id');
            }
        });

        Schema::table('areas', function (Blueprint $table) {
            $table->dropIndex(['branch_id', 'is_active']);
            $table->dropIndex(['code', 'branch_id']);
            if (Schema::hasColumn('areas', 'branch_id')) {
                $table->dropConstrainedForeignId('branch_id');
            }
        });
    }
};
