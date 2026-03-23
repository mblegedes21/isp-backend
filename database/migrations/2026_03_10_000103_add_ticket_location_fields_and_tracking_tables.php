<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            if (!Schema::hasColumn('tickets', 'ticket_latitude')) {
                $table->decimal('ticket_latitude', 10, 7)->nullable()->after('branch_id');
            }

            if (!Schema::hasColumn('tickets', 'ticket_longitude')) {
                $table->decimal('ticket_longitude', 10, 7)->nullable()->after('ticket_latitude');
            }

            if (!Schema::hasColumn('tickets', 'valid_radius_meter')) {
                $table->unsignedInteger('valid_radius_meter')->default(150)->after('ticket_longitude');
            }

            $table->index(['branch_id', 'area_id', 'ticket_latitude', 'ticket_longitude']);
        });

        Schema::create('technician_location_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('ticket_id')->nullable()->constrained('tickets')->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->decimal('accuracy', 8, 2)->nullable();
            $table->decimal('calculated_distance_meter', 10, 2)->nullable();
            $table->enum('location_status', ['valid', 'warning', 'suspicious', 'rejected'])->default('valid');
            $table->unsignedInteger('risk_score')->default(0);
            $table->json('risk_reasons')->nullable();
            $table->string('source_type', 40)->default('heartbeat');
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['ticket_id', 'created_at']);
            $table->index(['branch_id', 'area_id', 'created_at']);
            $table->index(['location_status', 'created_at']);
        });

        Schema::create('ticket_progress_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->enum('progress_type', ['MENUJU_LOKASI', 'MULAI_PEKERJAAN', 'TESTING', 'SELESAI']);
            $table->string('image_path')->nullable();
            $table->string('temp_path')->nullable();
            $table->decimal('image_size_kb', 8, 2)->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->decimal('accuracy', 8, 2)->nullable();
            $table->decimal('calculated_distance_meter', 10, 2)->nullable();
            $table->enum('location_status', ['valid', 'warning', 'suspicious', 'rejected'])->default('valid');
            $table->unsignedInteger('risk_score')->default(0);
            $table->json('risk_reasons')->nullable();
            $table->timestamp('captured_at_server')->nullable();
            $table->timestamp('uploaded_at_server')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->string('status', 20)->default('PENDING');
            $table->timestamps();

            $table->unique(['ticket_id', 'user_id', 'progress_type']);
            $table->index(['user_id', 'created_at']);
            $table->index(['ticket_id', 'created_at']);
            $table->index(['branch_id', 'area_id', 'created_at']);
            $table->index(['location_status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_progress_photos');
        Schema::dropIfExists('technician_location_logs');

        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex(['branch_id', 'area_id', 'ticket_latitude', 'ticket_longitude']);
            if (Schema::hasColumn('tickets', 'valid_radius_meter')) {
                $table->dropColumn('valid_radius_meter');
            }
            if (Schema::hasColumn('tickets', 'ticket_longitude')) {
                $table->dropColumn('ticket_longitude');
            }
            if (Schema::hasColumn('tickets', 'ticket_latitude')) {
                $table->dropColumn('ticket_latitude');
            }
        });
    }
};
