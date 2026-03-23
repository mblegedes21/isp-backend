<?php

namespace Database\Seeders;

use App\Models\MaterialCategory;
use Illuminate\Database\Seeder;

class MaterialCategorySeeder extends Seeder
{
    public function run(): void
    {
        foreach (MaterialCategory::STANDARDIZED_CATEGORIES as $name => $description) {
            MaterialCategory::query()->updateOrCreate(
                ['name' => $name],
                ['description' => $description]
            );
        }
    }
}
