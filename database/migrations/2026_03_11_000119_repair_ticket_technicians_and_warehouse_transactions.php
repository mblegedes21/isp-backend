<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('ticket_technicians')) {
            Schema::create('ticket_technicians', function (Blueprint $table) {
                $table->id();
                $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
                $table->foreignId('technician_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('created_at')->nullable();
                $table->timestamp('updated_at')->nullable();
                $table->unique(['ticket_id', 'technician_id']);
            });
        } else {
            Schema::table('ticket_technicians', function (Blueprint $table) {
                if (!Schema::hasColumn('ticket_technicians', 'created_at')) {
                    $table->timestamp('created_at')->nullable();
                }

                if (!Schema::hasColumn('ticket_technicians', 'updated_at')) {
                    $table->timestamp('updated_at')->nullable();
                }
            });
        }

        if (!Schema::hasTable('warehouse_transactions')) {
            Schema::create('warehouse_transactions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('material_id')->nullable()->constrained('materials')->nullOnDelete();
                $table->foreignId('ticket_id')->nullable()->constrained('tickets')->nullOnDelete();
                $table->string('transaction_type', 60)->index();
                $table->integer('quantity')->default(0);
                $table->decimal('unit_price', 12, 2)->nullable();
                $table->decimal('total_price', 12, 2)->nullable();
                $table->foreignId('technician_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('source_branch')->nullable();
                $table->string('destination_branch')->nullable();
                $table->string('supplier')->nullable();
                $table->string('customer')->nullable();
                $table->foreignId('purchase_request_id')->nullable()->constrained('purchase_requests')->nullOnDelete();
                $table->string('condition', 80)->nullable();
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->string('status')->default('completed')->index();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('ticket_technicians')) {
            Schema::table('ticket_technicians', function (Blueprint $table) {
                if (Schema::hasColumn('ticket_technicians', 'updated_at')) {
                    $table->dropColumn('updated_at');
                }
            });
        }
    }
};
