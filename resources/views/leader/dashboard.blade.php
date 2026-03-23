@extends('layouts.app')

@section('title', 'Leader Dashboard')

@section('content')
@php
    $demoTickets = is_array($demoTickets ?? null) ? $demoTickets : [
        ['id' => 1, 'code' => 'TK-010', 'tech' => 'Sari', 'status' => 'Pending Approval'],
        ['id' => 2, 'code' => 'TK-011', 'tech' => 'Doni', 'status' => 'Sedang Dikerjakan'],
        ['id' => 3, 'code' => 'TK-012', 'tech' => 'Rama', 'status' => 'Selesai'],
    ];

    $total = count($demoTickets);
    $pending = count(array_filter($demoTickets, fn($t) => ($t['status'] ?? '') === 'Pending Approval'));
    $active = count(array_filter($demoTickets, fn($t) => ($t['status'] ?? '') === 'Sedang Dikerjakan'));
    $done = count(array_filter($demoTickets, fn($t) => ($t['status'] ?? '') === 'Selesai'));
@endphp

<div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Leader Dashboard</h1>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
            <p class="text-gray-600 text-sm font-medium">Total Ticket Tim</p>
            <p class="text-3xl font-bold text-gray-900">{{ $total ?? 0 }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
            <p class="text-gray-600 text-sm font-medium">Pending Approval</p>
            <p class="text-3xl font-bold text-yellow-600">{{ $pending ?? 0 }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
            <p class="text-gray-600 text-sm font-medium">Sedang Dikerjakan</p>
            <p class="text-3xl font-bold text-blue-600">{{ $active ?? 0 }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
            <p class="text-gray-600 text-sm font-medium">Selesai</p>
            <p class="text-3xl font-bold text-green-600">{{ $done ?? 0 }}</p>
        </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Persetujuan Ticket</h2>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="text-left text-gray-600 border-b">
                    <tr>
                        <th class="py-2">Ticket</th>
                        <th class="py-2">Teknisi</th>
                        <th class="py-2">Status</th>
                        <th class="py-2">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach(($demoTickets ?? []) as $t)
                    <tr class="border-b">
                        <td class="py-2 font-mono">{{ $t['code'] ?? '' }}</td>
                        <td class="py-2">{{ $t['tech'] ?? '' }}</td>
                        <td class="py-2">{{ $t['status'] ?? '' }}</td>
                        <td class="py-2">
                            <a href="{{ url('#') }}" class="text-green-600">Approve</a>
                            <span class="text-gray-400 px-1">|</span>
                            <a href="{{ url('#') }}" class="text-red-600">Reject</a>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
