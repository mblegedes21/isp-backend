<x-app-layout>
    <x-slot name="header">Dashboard Teknisi</x-slot>

    @php
        $demoTickets = is_array($demoTickets ?? null) ? $demoTickets : [
            ['id' => 1, 'code' => 'TK-001', 'job' => 'Tarik Kabel', 'status' => 'Belum Dikerjakan', 'leader' => 'Budi'],
            ['id' => 2, 'code' => 'TK-002', 'job' => 'Maintenance', 'status' => 'Sedang Dikerjakan', 'leader' => 'Andi'],
            ['id' => 3, 'code' => 'TK-003', 'job' => 'Pemasangan Baru', 'status' => 'Belum Selesai', 'leader' => 'Rina'],
        ];

        $demoItems = is_array($demoItems ?? null) ? $demoItems : [
            ['name' => 'ONU Model X', 'qty' => 2],
            ['name' => 'Splitter 1:8', 'qty' => 1],
            ['name' => 'Kabel Drop (m)', 'qty' => 50],
        ];

        $totalTickets = count($demoTickets);
        $belumDikerjakan = count(array_filter($demoTickets, fn($t) => ($t['status'] ?? '') === 'Belum Dikerjakan'));
        $sedangDikerjakan = count(array_filter($demoTickets, fn($t) => ($t['status'] ?? '') === 'Sedang Dikerjakan'));
        $belumSelesai = count(array_filter($demoTickets, fn($t) => ($t['status'] ?? '') === 'Belum Selesai'));
    @endphp

    <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-white rounded-lg shadow p-4">
                <div class="text-sm text-gray-500">Total Ticket</div>
                <div class="text-2xl font-bold">{{ $totalTickets ?? 0 }}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
                <div class="text-sm text-gray-500">Belum Dikerjakan</div>
                <div class="text-2xl font-bold text-yellow-600">{{ $belumDikerjakan ?? 0 }}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
                <div class="text-sm text-gray-500">Sedang Dikerjakan</div>
                <div class="text-2xl font-bold text-blue-600">{{ $sedangDikerjakan ?? 0 }}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
                <div class="text-sm text-gray-500">Belum Selesai</div>
                <div class="text-2xl font-bold text-red-600">{{ $belumSelesai ?? 0 }}</div>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-lg font-semibold mb-3">Barang Dibawa</h2>
            <ul class="space-y-2">
                @foreach(($demoItems ?? []) as $item)
                <li class="flex items-center justify-between border rounded px-3 py-2">
                    <span>{{ $item['name'] ?? '' }}</span>
                    <span class="text-sm text-gray-600">Qty: {{ $item['qty'] ?? 0 }}</span>
                </li>
                @endforeach
            </ul>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-lg font-semibold mb-3">Daftar Ticket</h2>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="text-left text-gray-600 border-b">
                        <tr>
                            <th class="py-2">Nomor Ticket</th>
                            <th class="py-2">Jenis Pekerjaan</th>
                            <th class="py-2">Status</th>
                            <th class="py-2">Leader</th>
                            <th class="py-2">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach(($demoTickets ?? []) as $t)
                        <tr class="border-b">
                            <td class="py-2 font-mono">{{ $t['code'] ?? '' }}</td>
                            <td class="py-2">{{ $t['job'] ?? '' }}</td>
                            <td class="py-2">{{ $t['status'] ?? '' }}</td>
                            <td class="py-2">{{ $t['leader'] ?? '' }}</td>
                            <td class="py-2">
                                <a href="{{ route('technician.tickets.show', $t['id'] ?? 0) }}" class="text-indigo-600">Detail</a>
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</x-app-layout>
