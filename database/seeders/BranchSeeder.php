<?php

namespace Database\Seeders;

use App\Models\Branch;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        $branches = [
            ['name' => 'CABANG PUSAT', 'code' => 'PST'],
            ['name' => 'GABUS', 'code' => 'GBS'],
            ['name' => 'CIKARANG', 'code' => 'CKG'],
            ['name' => 'KARAWANG', 'code' => 'KRW'],
            ['name' => 'SUKABUMI', 'code' => 'SKB'],
        ];

        foreach ($branches as $branch) {
            Branch::query()->updateOrCreate(
                ['code' => $branch['code']],
                [
                    'name' => $branch['name'],
                    'timezone' => 'Asia/Jakarta',
                    'is_active' => true,
                ]
            );
        }
    }
}
