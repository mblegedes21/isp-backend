<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->foreignId('leader_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('technician_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['ASSIGNED', 'REASSIGNED', 'UNASSIGNED'])->default('ASSIGNED');
            $table->timestamps();

            $table->index(['branch_id', 'area_id', 'status']);
            $table->index(['leader_id', 'technician_id', 'created_at']);
        });

        Schema::create('ticket_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('disk', 40)->default('evidence-private');
            $table->string('path')->nullable();
            $table->string('temp_path')->nullable();
            $table->string('original_name', 255)->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->unsignedInteger('size_bytes')->nullable();
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->enum('status', ['PENDING', 'PROCESSING', 'READY', 'FAILED'])->default('PENDING');
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['branch_id', 'area_id', 'status']);
            $table->index(['ticket_id', 'created_at']);
        });

        Schema::create('attendance_flags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendance_id')->constrained('attendances')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->enum('flag_type', ['TERLAMBAT', 'TIDAK_CHECK_OUT', 'TIDAK_HADIR', 'LOKASI_TIDAK_SESUAI']);
            $table->enum('status', ['BELUM_DITINJAU', 'MENUNGGU_PENJELASAN', 'PERINGATAN_TERKIRIM', 'LEADER_DINOTIFIKASI', 'SELESAI'])->default('BELUM_DITINJAU');
            $table->json('context')->nullable();
            $table->timestamps();

            $table->index(['branch_id', 'area_id', 'flag_type']);
            $table->index(['status', 'created_at']);
        });

        Schema::create('loss_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->nullable()->constrained('tickets')->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->foreignId('technician_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('material_id')->nullable()->constrained('products')->nullOnDelete();
            $table->unsignedInteger('quantity');
            $table->decimal('loss_percent', 8, 2)->default(0);
            $table->text('reason');
            $table->string('evidence_path')->nullable();
            $table->enum('status', ['MENUNGGU', 'DISETUJUI', 'DITOLAK', 'DALAM_INVESTIGASI'])->default('MENUNGGU');
            $table->text('rejected_reason')->nullable();
            $table->timestamps();

            $table->index(['branch_id', 'area_id', 'status']);
            $table->index(['technician_id', 'created_at']);
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 120);
            $table->string('module', 80);
            $table->string('entity_type', 120);
            $table->string('entity_id', 120);
            $table->json('before_state')->nullable();
            $table->json('after_state')->nullable();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index(['branch_id', 'area_id', 'created_at']);
            $table->index(['module', 'action', 'created_at']);
            $table->index(['entity_type', 'entity_id']);
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['branch_id', 'area_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('loss_reports');
        Schema::dropIfExists('attendance_flags');
        Schema::dropIfExists('ticket_images');
        Schema::dropIfExists('ticket_assignments');
    }
};
