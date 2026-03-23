<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('ticket_technicians')) {
            Schema::table('ticket_technicians', function (Blueprint $table) {
                if (!Schema::hasColumn('ticket_technicians', 'created_at')) {
                    $table->timestamp('created_at')->nullable();
                }

                if (!Schema::hasColumn('ticket_technicians', 'updated_at')) {
                    $table->timestamp('updated_at')->nullable();
                }
            });
        }

        if (!Schema::hasTable('ticket_material_requests')) {
            Schema::create('ticket_material_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
                $table->foreignId('material_id')->constrained('materials')->cascadeOnDelete();
                $table->unsignedInteger('quantity');
                $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
                $table->string('requested_role', 40);
                $table->string('status', 40)->default('PENDING')->index();
                $table->foreignId('released_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('return_verified_by')->nullable()->constrained('users')->nullOnDelete();
                $table->unsignedInteger('released_quantity')->default(0);
                $table->unsignedInteger('returned_quantity')->default(0);
                $table->timestamps();

                $table->index(['ticket_id', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_material_requests');
    }
};
