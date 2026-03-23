<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Material;
use App\Models\MaterialBrand;
use App\Models\MaterialCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MaterialSeeder extends Seeder
{
    public function run(): void
    {
        $branch = Branch::query()->where('code', 'PST')->first();

        $materials = [
            ['category' => 'PERANGKAT', 'brand' => 'Huawei', 'name' => 'HG8245H', 'sku' => 'ONT-HUAWEI-HG8245H', 'unit' => 'pcs', 'stock' => 120, 'minimum_stock' => 20],
            ['category' => 'PERANGKAT', 'brand' => 'Fiberhome', 'name' => 'AN5506', 'sku' => 'ONT-FIBERHOME-AN5506', 'unit' => 'pcs', 'stock' => 80, 'minimum_stock' => 15],
            ['category' => 'FIBER_AKSESORIS', 'brand' => 'Netlink', 'name' => 'SC-SC 3m', 'sku' => 'PATCH-NETLINK-SCSC-3M', 'unit' => 'pcs', 'stock' => 160, 'minimum_stock' => 25],
            ['category' => 'KABEL', 'brand' => 'Fiberhome', 'name' => 'Dropcore 1 Core', 'sku' => 'DROPCORE-FIBERHOME-1C', 'unit' => 'meter', 'stock' => 500, 'minimum_stock' => 100],
        ];

        foreach ($materials as $payload) {
            $category = MaterialCategory::query()->where('name', $payload['category'])->first();
            $brand = MaterialBrand::query()
                ->where('name', $payload['brand'])
                ->where('category_id', $category?->id)
                ->first();

            if (!$category) {
                continue;
            }

            $material = Material::query()->updateOrCreate(
                ['sku' => $payload['sku']],
                [
                    'category_id' => $category->id,
                    'brand_id' => $brand?->id,
                    'name' => $payload['name'],
                    'unit' => $payload['unit'],
                    'stock' => $payload['stock'],
                    'minimum_stock' => $payload['minimum_stock'],
                    'branch_id' => $branch?->id,
                    'description' => null,
                    'is_active' => true,
                ]
            );

            DB::table('products')->updateOrInsert(
                ['id' => $material->id],
                [
                    'branch_id' => $material->branch_id,
                    'name' => $material->name,
                    'sku' => $material->sku,
                    'category' => $category->name,
                    'price' => 0,
                    'stok' => $material->stock,
                    'min_stock' => $material->minimum_stock,
                    'unit_type' => $material->unit,
                    'is_active' => $material->is_active,
                    'description' => $material->description,
                    'lead_time_days' => 7,
                    'is_serialized' => false,
                    'avg_daily_usage' => 1,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }
}
