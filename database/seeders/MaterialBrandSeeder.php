<?php

namespace Database\Seeders;

use App\Models\MaterialBrand;
use App\Models\MaterialCategory;
use Illuminate\Database\Seeder;

class MaterialBrandSeeder extends Seeder
{
    public function run(): void
    {
        $brandsByCategory = [
            'PERANGKAT' => ['Huawei', 'Fiberhome', 'ZTE', 'Totolink', 'Netlink'],
            'KABEL' => ['Fiberhome', 'Netlink'],
            'FIBER_AKSESORIS' => ['Huawei', 'Fiberhome', 'ZTE', 'Netlink'],
            'SPLITTER' => ['Huawei', 'Fiberhome'],
            'BOX_DISTRIBUSI' => ['Fiberhome', 'Netlink'],
            'MATERIAL_INSTALASI' => ['Nankai', 'Suprema', 'Netlink'],
            'ALAT_TEKNISI' => ['Fujikura', 'Jonard', 'Proskit'],
        ];

        foreach ($brandsByCategory as $categoryName => $brands) {
            $category = MaterialCategory::query()->where('name', $categoryName)->first();
            if (!$category) {
                continue;
            }

            foreach ($brands as $brandName) {
                MaterialBrand::query()->updateOrCreate(
                    [
                        'category_id' => $category->id,
                        'name' => $brandName,
                    ],
                    []
                );
            }
        }
    }
}
