<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$user->isMitra()) {
            return response()->json([
                'message' => 'Akses pelanggan hanya untuk mitra.',
                'data' => [],
            ], 403);
        }

        $customers = Customer::query()
            ->where('mitra_id', $user->id)
            ->latest()
            ->get()
            ->map(fn (Customer $customer) => $this->serializeCustomer($customer))
            ->values();

        return response()->json([
            'message' => 'Pelanggan berhasil dimuat.',
            'data' => $customers,
        ]);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$user->isMitra()) {
            return response()->json([
                'message' => 'Akses dashboard mitra hanya untuk mitra.',
                'data' => [
                    'total_customers' => 0,
                    'total_omset' => 0,
                    'total_ppn' => 0,
                    'total_bhp_uso' => 0,
                ],
            ], 403);
        }

        $customers = Customer::query()->where('mitra_id', $user->id);

        return response()->json([
            'message' => 'Ringkasan mitra berhasil dimuat.',
            'data' => [
                'total_customers' => $customers->count(),
                'total_omset' => (float) $customers->sum('total_price'),
                'total_ppn' => (float) $customers->sum('ppn'),
                'total_bhp_uso' => (float) ($customers->sum('bhp') + $customers->sum('uso')),
            ],
        ]);
    }

    public function managerIndex(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$user->isManager()) {
            return response()->json([
                'message' => 'Akses monitoring mitra hanya untuk manager.',
                'data' => [],
            ], 403);
        }

        $mitraList = User::query()
            ->where('role', User::databaseRole('MITRA'))
            ->with(['customers'])
            ->orderBy('name')
            ->get()
            ->map(function (User $mitra) {
                $customers = $mitra->customers;

                return [
                    'id' => (string) $mitra->id,
                    'name' => $mitra->name,
                    'email' => $mitra->email,
                    'status' => $customers->isEmpty() ? 'Belum Aktif' : 'Aktif',
                    'total_customers' => $customers->count(),
                    'total_omset' => (float) $customers->sum('total_price'),
                ];
            })
            ->values();

        return response()->json([
            'message' => 'Monitoring mitra berhasil dimuat.',
            'data' => $mitraList,
        ]);
    }

    public function managerShow(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$user->isManager()) {
            return response()->json([
                'message' => 'Akses detail mitra hanya untuk manager.',
                'data' => null,
            ], 403);
        }

        $mitra = User::query()
            ->where('role', User::databaseRole('MITRA'))
            ->with(['customers'])
            ->findOrFail($id);

        $customers = $mitra->customers;

        return response()->json([
            'message' => 'Detail mitra berhasil dimuat.',
            'data' => [
                'id' => (string) $mitra->id,
                'name' => $mitra->name,
                'email' => $mitra->email,
                'total_customers' => $customers->count(),
                'total_omset' => (float) $customers->sum('total_price'),
                'total_ppn' => (float) $customers->sum('ppn'),
                'total_bhp' => (float) $customers->sum('bhp'),
                'total_uso' => (float) $customers->sum('uso'),
                'customers' => $customers
                    ->map(fn (Customer $customer) => $this->serializeCustomer($customer))
                    ->values(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$user->isMitra()) {
            return response()->json([
                'message' => 'Akses pelanggan hanya untuk mitra.',
            ], 403);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'nik' => ['required', 'string', 'max:32'],
            'no_hp' => ['required', 'string', 'max:32'],
            'alamat' => ['required', 'string'],
            'latitude' => ['required', 'numeric'],
            'longitude' => ['required', 'numeric'],
            'package_name' => ['required', 'string', 'max:150'],
            'package_price' => ['required', 'numeric', 'min:0'],
        ]);

        $packagePrice = (float) $data['package_price'];
        $ppn = $packagePrice * 0.11;
        $bhp = $packagePrice * 0.005;
        $uso = $packagePrice * 0.015;
        $total = $packagePrice + $ppn + $bhp + $uso;

        $customer = Customer::query()->create([
            'mitra_id' => $user->id,
            'name' => $data['name'],
            'nik' => $data['nik'],
            'no_hp' => $data['no_hp'],
            'alamat' => $data['alamat'],
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'package_name' => $data['package_name'],
            'package_price' => $packagePrice,
            'ppn' => $ppn,
            'bhp' => $bhp,
            'uso' => $uso,
            'total_price' => $total,
        ]);

        return response()->json([
            'message' => 'Pelanggan berhasil ditambahkan.',
            'data' => $this->serializeCustomer($customer),
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$user->isMitra()) {
            return response()->json([
                'message' => 'Akses pelanggan hanya untuk mitra.',
            ], 403);
        }

        $customer = Customer::query()
            ->where('mitra_id', $user->id)
            ->findOrFail($id);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'nik' => ['required', 'string', 'max:32'],
            'no_hp' => ['required', 'string', 'max:32'],
            'alamat' => ['required', 'string'],
            'latitude' => ['required', 'numeric'],
            'longitude' => ['required', 'numeric'],
            'package_name' => ['required', 'string', 'max:150'],
            'package_price' => ['required', 'numeric', 'min:0'],
        ]);

        $pricing = $this->calculatePricing((float) $data['package_price']);

        $customer->update([
            'name' => $data['name'],
            'nik' => $data['nik'],
            'no_hp' => $data['no_hp'],
            'alamat' => $data['alamat'],
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'package_name' => $data['package_name'],
            'package_price' => $pricing['package_price'],
            'ppn' => $pricing['ppn'],
            'bhp' => $pricing['bhp'],
            'uso' => $pricing['uso'],
            'total_price' => $pricing['total_price'],
        ]);

        return response()->json([
            'message' => 'Pelanggan berhasil diperbarui.',
            'data' => $this->serializeCustomer($customer->fresh()),
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$user->isMitra()) {
            return response()->json([
                'message' => 'Akses pelanggan hanya untuk mitra.',
            ], 403);
        }

        $customer = Customer::query()
            ->where('mitra_id', $user->id)
            ->findOrFail($id);

        $customer->delete();

        return response()->json([
            'message' => 'Pelanggan berhasil dihapus.',
        ]);
    }

    public function managerSummary(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$user->isManager()) {
            return response()->json([
                'message' => 'Akses ringkasan mitra hanya untuk manager.',
                'data' => [
                    'total_mitra' => 0,
                    'total_omset' => 0,
                    'total_ppn' => 0,
                    'total_bhp_uso' => 0,
                ],
            ], 403);
        }

        $totalBhp = (float) Customer::query()->sum('bhp');
        $totalUso = (float) Customer::query()->sum('uso');

        return response()->json([
            'message' => 'Ringkasan monitoring mitra berhasil dimuat.',
            'data' => [
                'total_mitra' => User::query()->where('role', User::databaseRole('MITRA'))->count(),
                'total_omset' => (float) Customer::query()->sum('total_price'),
                'total_ppn' => (float) Customer::query()->sum('ppn'),
                'total_bhp_uso' => $totalBhp + $totalUso,
            ],
        ]);
    }

    private function serializeCustomer(Customer $customer): array
    {
        return [
            'id' => (string) $customer->id,
            'mitra_id' => (string) $customer->mitra_id,
            'name' => $customer->name,
            'nik' => $customer->nik,
            'no_hp' => $customer->no_hp,
            'alamat' => $customer->alamat,
            'latitude' => (float) $customer->latitude,
            'longitude' => (float) $customer->longitude,
            'package_name' => $customer->package_name,
            'package_price' => (float) $customer->package_price,
            'ppn' => (float) $customer->ppn,
            'bhp' => (float) $customer->bhp,
            'uso' => (float) $customer->uso,
            'total_price' => (float) $customer->total_price,
            'created_at' => $customer->created_at?->toIso8601String(),
        ];
    }

    private function calculatePricing(float $packagePrice): array
    {
        $ppn = $packagePrice * 0.11;
        $bhp = $packagePrice * 0.005;
        $uso = $packagePrice * 0.015;

        return [
            'package_price' => $packagePrice,
            'ppn' => $ppn,
            'bhp' => $bhp,
            'uso' => $uso,
            'total_price' => $packagePrice + $ppn + $bhp + $uso,
        ];
    }
}
