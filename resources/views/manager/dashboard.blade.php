@extends('layouts.app')

@section('title', 'Manager Dashboard')

@section('content')
@php
    $stats = $stats ?? [
        'active_projects' => 5,
        'total_stock' => 1420,
        'low_stock' => 6,
        'active_transfers' => 4,
    ];

    $lowStock = is_array($lowStock ?? null) ? $lowStock : [
        ['sku' => 'SPL-1:2', 'name' => 'Splitter 1:2', 'qty' => 2],
        ['sku' => 'ODP-8', 'name' => 'ODP 8 Port', 'qty' => 3],
    ];

    $projects = is_array($projects ?? null) ? $projects : [
        ['name' => 'Instalasi Cabang A', 'leader' => 'Budi', 'status' => 'Berjalan'],
        ['name' => 'Maintenance Cabang B', 'leader' => 'Andi', 'status' => 'Berjalan'],
    ];
@endphp

<div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Manager / Owner Dashboard</h1>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
            <p class="text-gray-600 text-sm font-medium">Total Proyek Aktif</p>
            <p class="text-3xl font-bold text-gray-900">{{ $stats['active_projects'] ?? 0 }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
            <p class="text-gray-600 text-sm font-medium">Total Stock</p>
            <p class="text-3xl font-bold text-gray-900">{{ $stats['total_stock'] ?? 0 }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
            <p class="text-gray-600 text-sm font-medium">Low Stock Alert</p>
            <p class="text-3xl font-bold text-red-600">{{ $stats['low_stock'] ?? 0 }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
            <p class="text-gray-600 text-sm font-medium">Total Transfer Aktif</p>
            <p class="text-3xl font-bold text-yellow-600">{{ $stats['active_transfers'] ?? 0 }}</p>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">Barang Hampir Habis</h2>
            <table class="w-full text-sm">
                <thead class="text-left text-gray-600 border-b">
                    <tr>
                        <th class="py-2">SKU</th>
                        <th class="py-2">Nama</th>
                        <th class="py-2">Sisa</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach(($lowStock ?? []) as $item)
                    <tr class="border-b">
                        <td class="py-2 font-mono">{{ $item['sku'] ?? '' }}</td>
                        <td class="py-2">{{ $item['name'] ?? '' }}</td>
                        <td class="py-2">{{ $item['qty'] ?? 0 }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">Proyek Berjalan</h2>
            <table class="w-full text-sm">
                <thead class="text-left text-gray-600 border-b">
                    <tr>
                        <th class="py-2">Proyek</th>
                        <th class="py-2">Leader</th>
                        <th class="py-2">Status</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach(($projects ?? []) as $p)
                    <tr class="border-b">
                        <td class="py-2">{{ $p['name'] ?? '' }}</td>
                        <td class="py-2">{{ $p['leader'] ?? '' }}</td>
                        <td class="py-2">{{ $p['status'] ?? '' }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
