<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $branch = Branch::query()->firstOrCreate(
            ['code' => 'PST'],
            [
                'name' => 'CABANG PUSAT',
                'timezone' => 'Asia/Jakarta',
                'is_active' => true,
            ]
        );

        $area = Area::query()->where('branch_id', $branch->id)->first() ?? Area::query()->create([
            'branch_id' => $branch->id,
            'name' => 'Area '.$branch->name,
            'code' => 'AR-PST',
            'is_active' => true,
        ]);

        $users = [
            ['name' => 'Admin ISP', 'email' => 'admin@isp.local', 'role' => 'admin'],
            ['name' => 'Manager ISP', 'email' => 'manager@isp.local', 'role' => 'manager'],
            ['name' => 'Leader ISP', 'email' => 'leader@isp.local', 'role' => 'leader'],
            ['name' => 'Technician ISP', 'email' => 'technician@isp.local', 'role' => 'technician'],
            ['name' => 'Teknisi ISP', 'email' => 'teknisi@isp.local', 'role' => 'technician'],
            ['name' => 'Warehouse ISP', 'email' => 'warehouse@isp.local', 'role' => 'warehouse'],
            ['name' => 'Gudang ISP', 'email' => 'gudang@isp.local', 'role' => 'warehouse'],
            ['name' => 'Owner ISP', 'email' => 'owner@isp.local', 'role' => 'owner'],
        ];

        foreach ($users as $payload) {
            User::query()->updateOrCreate(
                ['email' => $payload['email']],
                [
                    'name' => $payload['name'],
                    'password' => Hash::make('password123'),
                    'role' => $payload['role'],
                    'branch_id' => $branch->id,
                    'area_id' => $area->id,
                ]
            );
        }
    }
}
