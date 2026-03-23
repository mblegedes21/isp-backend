<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('ticket_material_assignments')) {
            return;
        }

        Schema::create('ticket_material_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignId('technician_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('material_id')->constrained('materials')->cascadeOnDelete();
            $table->foreignId('ticket_material_request_id')->nullable()->constrained('ticket_material_requests')->nullOnDelete();
            $table->unsignedInteger('quantity_assigned')->default(0);
            $table->unsignedInteger('quantity_returned')->default(0);
            $table->timestamps();

            $table->unique(['ticket_id', 'technician_id', 'material_id'], 'ticket_material_assignments_unique_scope');
            $table->index(['ticket_id', 'technician_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_material_assignments');
    }
};
