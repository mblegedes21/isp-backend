<x-app-layout>
    <x-slot name="header">Dashboard Gudang</x-slot>

    @php
        $stats = $stats ?? [
            'total_stock' => 1420,
            'low_stock' => 6,
            'out_today' => 34,
            'transfer_active' => 4,
        ];
    @endphp

    <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-white rounded-lg shadow p-4">
                <div class="text-sm text-gray-500">Total Stock</div>
                <div class="text-2xl font-bold">{{ $stats['total_stock'] ?? 0 }}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
                <div class="text-sm text-gray-500">Low Stock</div>
                <div class="text-2xl font-bold text-red-600">{{ $stats['low_stock'] ?? 0 }}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
                <div class="text-sm text-gray-500">Barang Keluar Hari Ini</div>
                <div class="text-2xl font-bold text-blue-600">{{ $stats['out_today'] ?? 0 }}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
                <div class="text-sm text-gray-500">Transfer Aktif</div>
                <div class="text-2xl font-bold text-yellow-600">{{ $stats['transfer_active'] ?? 0 }}</div>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-lg font-semibold mb-3">Ringkasan Stok</h2>
            <div class="text-sm text-gray-600">Demo mode. Gunakan menu Permintaan dan Transfer untuk simulasi.</div>
        </div>
    </div>
</x-app-layout>
