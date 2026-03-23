<?php

use App\Models\MaterialCategory;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $canonicalDescriptions = MaterialCategory::STANDARDIZED_CATEGORIES;
        $legacyMap = [
            'ONT' => 'PERANGKAT',
            'KABEL_OPTIC' => 'KABEL',
            'KABEL_FIBER_OPTIC' => 'KABEL',
            'PATCHCORE' => 'FIBER_AKSESORIS',
            'CONNECTOR' => 'FIBER_AKSESORIS',
            'CONNECTOR_FIBER' => 'FIBER_AKSESORIS',
            'ODP' => 'BOX_DISTRIBUSI',
            'ODC' => 'BOX_DISTRIBUSI',
            'UNCATEGORIZED' => 'LAINNYA',
            'UN_CATEGORIZED' => 'LAINNYA',
            'LAIN_LAIN' => 'LAINNYA',
        ];

        foreach ($canonicalDescriptions as $name => $description) {
            MaterialCategory::query()->updateOrCreate(
                ['name' => $name],
                ['description' => $description]
            );
        }

        $canonicalIds = MaterialCategory::query()
            ->whereIn('name', array_keys($canonicalDescriptions))
            ->pluck('id', 'name');

        MaterialCategory::query()
            ->orderBy('id')
            ->get()
            ->each(function (MaterialCategory $category) use ($canonicalIds, $canonicalDescriptions, $legacyMap) {
                $normalized = MaterialCategory::normalizeName($category->name);
                $canonicalName = $legacyMap[$normalized]
                    ?? (array_key_exists($normalized, $canonicalDescriptions) ? $normalized : 'LAINNYA');
                $targetId = $canonicalIds[$canonicalName] ?? null;

                if (!$targetId) {
                    return;
                }

                if ((int) $category->id !== (int) $targetId) {
                    DB::table('materials')
                        ->where('category_id', $category->id)
                        ->update(['category_id' => $targetId]);

                    DB::table('material_brands')
                        ->where('category_id', $category->id)
                        ->orderBy('id')
                        ->get()
                        ->each(function (object $brand) use ($targetId) {
                            $existingBrandId = DB::table('material_brands')
                                ->where('category_id', $targetId)
                                ->where('name', $brand->name)
                                ->value('id');

                            if ($existingBrandId) {
                                DB::table('materials')
                                    ->where('brand_id', $brand->id)
                                    ->update(['brand_id' => $existingBrandId]);

                                DB::table('material_brands')
                                    ->where('id', $brand->id)
                                    ->delete();

                                return;
                            }

                            DB::table('material_brands')
                                ->where('id', $brand->id)
                                ->update(['category_id' => $targetId]);
                        });

                    $category->delete();
                    return;
                }

                $category->update([
                    'name' => $canonicalName,
                    'description' => $canonicalDescriptions[$canonicalName],
                ]);
            });

        DB::table('products')->get()->each(function (object $product) use ($legacyMap, $canonicalDescriptions) {
            $normalized = MaterialCategory::normalizeName((string) ($product->category ?? ''));
            $canonicalName = $legacyMap[$normalized]
                ?? (array_key_exists($normalized, $canonicalDescriptions) ? $normalized : 'LAINNYA');

            DB::table('products')
                ->where('id', $product->id)
                ->update(['category' => $canonicalName]);
        });
    }

    public function down(): void
    {
        // Intentionally left empty because standardized categories are the permanent source of truth.
    }
};
