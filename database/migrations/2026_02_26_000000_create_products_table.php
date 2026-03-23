<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('sku')->unique();
            $table->decimal('price', 15, 2)->default(0);
            $table->integer('stok')->default(0);
            $table->integer('min_stock')->default(5);
            $table->integer('lead_time_days')->default(7);
            $table->boolean('is_serialized')->default(false);
            $table->integer('avg_daily_usage')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
