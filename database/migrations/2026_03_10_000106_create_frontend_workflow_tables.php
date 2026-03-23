<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('audit_logs', 'review_status')) {
                $table->string('review_status', 32)->default('BARU')->after('ip_address');
                $table->string('source', 120)->nullable()->after('review_status');
                $table->index(['review_status', 'created_at'], 'audit_logs_review_status_created_idx');
            }
        });

        if (!Schema::hasTable('stock_transfers')) {
            Schema::create('stock_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_id')->constrained('products')->cascadeOnDelete();
            $table->string('from_branch', 120);
            $table->string('to_branch', 120);
            $table->unsignedInteger('quantity');
            $table->string('status', 20)->default('PENDING');
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            });
        }

        if (!Schema::hasTable('ticket_material_reports')) {
            Schema::create('ticket_material_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignId('technician_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->text('material_used');
            $table->text('material_remaining')->nullable();
            $table->string('remaining_photo_path')->nullable();
            $table->string('remaining_photo_temp_path')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->decimal('accuracy', 8, 2)->nullable();
            $table->timestamp('captured_at_server')->nullable();
            $table->timestamp('uploaded_at_server')->nullable();
            $table->string('status', 20)->default('PENDING');
            $table->timestamps();

            $table->unique(['ticket_id', 'technician_id']);
            $table->index(['branch_id', 'area_id', 'created_at']);
            });
        }

        if (!Schema::hasTable('incidents')) {
            Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->string('severity', 20)->default('SEDANG');
            $table->unsignedInteger('ticket_count')->default(0);
            $table->unsignedInteger('escalation_count')->default(0);
            $table->timestamp('detected_at');
            $table->string('response_status', 32)->default('TERDETEKSI');
            $table->timestamps();

            $table->index(['response_status', 'detected_at']);
            });
        }

        if (!Schema::hasTable('area_actions')) {
            Schema::create('area_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->string('area_name', 120);
            $table->string('action', 160);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['area_id', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('area_actions');
        Schema::dropIfExists('incidents');
        Schema::dropIfExists('ticket_material_reports');
        Schema::dropIfExists('stock_transfers');

        Schema::table('audit_logs', function (Blueprint $table) {
            if (Schema::hasColumn('audit_logs', 'review_status')) {
                $table->dropIndex('audit_logs_review_status_created_idx');
                $table->dropColumn(['review_status', 'source']);
            }
        });
    }
};
