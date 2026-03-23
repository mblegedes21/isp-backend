<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('material_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120)->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('material_brands', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('material_categories')->cascadeOnDelete();
            $table->string('name', 120);
            $table->timestamps();

            $table->unique(['category_id', 'name']);
            $table->index(['name', 'category_id']);
        });

        Schema::create('materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('material_categories')->cascadeOnDelete();
            $table->foreignId('brand_id')->nullable()->constrained('material_brands')->nullOnDelete();
            $table->string('name', 150);
            $table->string('sku', 100)->unique();
            $table->string('unit', 30)->default('pcs');
            $table->integer('stock')->default(0);
            $table->integer('minimum_stock')->default(0);
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['category_id', 'brand_id']);
            $table->index(['branch_id', 'is_active']);
            $table->index(['stock', 'minimum_stock']);
        });

        $defaultCategoryId = DB::table('material_categories')->insertGetId([
            'name' => 'Uncategorized',
            'description' => 'Migrated materials without a mapped category.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $products = DB::table('products')->get();

        foreach ($products as $product) {
            DB::table('materials')->insert([
                'id' => $product->id,
                'category_id' => $defaultCategoryId,
                'brand_id' => null,
                'name' => $product->name,
                'sku' => $product->sku,
                'unit' => $product->unit_type ?? 'pcs',
                'stock' => $product->stok ?? 0,
                'minimum_stock' => $product->min_stock ?? 0,
                'branch_id' => $product->branch_id ?? null,
                'description' => $product->description ?? null,
                'is_active' => $product->is_active ?? true,
                'created_at' => $product->created_at ?? now(),
                'updated_at' => $product->updated_at ?? now(),
            ]);
        }

        DB::statement('ALTER TABLE materials AUTO_INCREMENT = 1000');
    }

    public function down(): void
    {
        Schema::dropIfExists('materials');
        Schema::dropIfExists('material_brands');
        Schema::dropIfExists('material_categories');
    }
};
