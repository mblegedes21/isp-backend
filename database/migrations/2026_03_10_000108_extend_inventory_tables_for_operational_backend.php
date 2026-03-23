<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'branch_id')) {
                $table->foreignId('branch_id')->nullable()->after('id')->constrained('branches')->nullOnDelete();
            }

            if (!Schema::hasColumn('products', 'unit_type')) {
                $table->string('unit_type', 30)->default('unit')->after('min_stock');
            }

            if (!Schema::hasColumn('products', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('unit_type');
            }

            $table->index(['branch_id', 'is_active']);
        });

        Schema::table('stock_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('stock_transactions', 'user_id')) {
                $table->foreignId('user_id')->nullable()->after('ticket_id')->constrained('users')->nullOnDelete();
            }

            if (!Schema::hasColumn('stock_transactions', 'reference_type')) {
                $table->string('reference_type', 60)->nullable()->after('quantity');
            }

            if (!Schema::hasColumn('stock_transactions', 'reference_id')) {
                $table->string('reference_id', 60)->nullable()->after('reference_type');
            }

            if (!Schema::hasColumn('stock_transactions', 'notes')) {
                $table->text('notes')->nullable()->after('reference_id');
            }

            $table->index(['user_id', 'created_at']);
        });

        Schema::table('stock_transfers', function (Blueprint $table) {
            if (!Schema::hasColumn('stock_transfers', 'source_branch_id')) {
                $table->foreignId('source_branch_id')->nullable()->after('material_id')->constrained('branches')->nullOnDelete();
            }

            if (!Schema::hasColumn('stock_transfers', 'destination_branch_id')) {
                $table->foreignId('destination_branch_id')->nullable()->after('source_branch_id')->constrained('branches')->nullOnDelete();
            }

            if (!Schema::hasColumn('stock_transfers', 'notes')) {
                $table->text('notes')->nullable()->after('quantity');
            }

            if (!Schema::hasColumn('stock_transfers', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('approved_by');
            }

            $table->index(['source_branch_id', 'destination_branch_id', 'status'], 'stock_transfer_src_dest_status_idx');
        });

        if (!Schema::hasTable('stock_receipts')) {
            Schema::create('stock_receipts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('material_id')->constrained('products')->cascadeOnDelete();
                $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
                $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
                $table->unsignedInteger('quantity');
                $table->string('source', 120)->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index(['branch_id', 'created_at']);
            });
        }

        if (!Schema::hasTable('stock_issues')) {
            Schema::create('stock_issues', function (Blueprint $table) {
                $table->id();
                $table->foreignId('material_id')->constrained('products')->cascadeOnDelete();
                $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
                $table->foreignId('area_id')->nullable()->constrained('areas')->nullOnDelete();
                $table->foreignId('ticket_id')->nullable()->constrained('tickets')->nullOnDelete();
                $table->foreignId('issued_to')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
                $table->unsignedInteger('quantity');
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index(['branch_id', 'created_at']);
                $table->index(['ticket_id', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_issues');
        Schema::dropIfExists('stock_receipts');

        Schema::table('stock_transfers', function (Blueprint $table) {
            if (Schema::hasColumn('stock_transfers', 'approved_at')) {
                $table->dropIndex('stock_transfer_src_dest_status_idx');
                $table->dropColumn(['notes', 'approved_at']);
                $table->dropConstrainedForeignId('destination_branch_id');
                $table->dropConstrainedForeignId('source_branch_id');
            }
        });

        Schema::table('stock_transactions', function (Blueprint $table) {
            if (Schema::hasColumn('stock_transactions', 'user_id')) {
                $table->dropIndex(['user_id', 'created_at']);
                $table->dropConstrainedForeignId('user_id');
                $table->dropColumn(['reference_type', 'reference_id', 'notes']);
            }
        });

        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'branch_id')) {
                $table->dropIndex(['branch_id', 'is_active']);
                $table->dropConstrainedForeignId('branch_id');
                $table->dropColumn(['unit_type', 'is_active']);
            }
        });
    }
};
