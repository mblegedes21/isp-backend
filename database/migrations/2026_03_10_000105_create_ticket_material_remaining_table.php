<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('ticket_material_remaining')) {
            return;
        }

        Schema::create('ticket_material_remaining', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignId('material_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('technician_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->unsignedInteger('quantity_remaining');
            $table->string('photo_path')->nullable();
            $table->string('temp_path')->nullable();
            $table->decimal('image_size_kb', 8, 2)->nullable();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->decimal('accuracy', 8, 2)->nullable();
            $table->decimal('calculated_distance_meter', 10, 2)->nullable();
            $table->enum('location_status', ['valid', 'warning', 'suspicious', 'rejected'])->default('valid');
            $table->boolean('needs_review')->default(false);
            $table->unsignedInteger('risk_score')->default(0);
            $table->json('risk_reasons')->nullable();
            $table->timestamp('captured_at_server')->nullable();
            $table->timestamp('uploaded_at_server')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->string('status', 20)->default('PENDING');
            $table->timestamps();

            $table->index(['ticket_id', 'created_at']);
            $table->index(['material_id', 'created_at']);
            $table->index(['technician_id', 'created_at']);
            $table->index(['branch_id', 'area_id', 'created_at']);
            $table->index(['location_status', 'needs_review', 'created_at'], 'ticket_mat_rem_loc_review_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_material_remaining');
    }
};
