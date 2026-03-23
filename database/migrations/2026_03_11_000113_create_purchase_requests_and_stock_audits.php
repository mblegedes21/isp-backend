<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_id')->constrained('materials')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->integer('quantity');
            $table->decimal('estimated_price', 15, 2);
            $table->string('supplier', 150)->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('pending');
            $table->timestamps();

            $table->index(['branch_id', 'status'], 'purchase_requests_branch_status_idx');
            $table->index(['material_id', 'created_at'], 'purchase_requests_material_created_idx');
        });

        Schema::create('stock_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_id')->constrained('materials')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->integer('system_stock');
            $table->integer('physical_stock');
            $table->integer('difference');
            $table->decimal('unit_price', 15, 2);
            $table->decimal('total_difference_value', 15, 2);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('status', 20)->default('pending');
            $table->timestamps();

            $table->index(['branch_id', 'status'], 'stock_audits_branch_status_idx');
            $table->index(['material_id', 'created_at'], 'stock_audits_material_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_audits');
        Schema::dropIfExists('purchase_requests');
    }
};
