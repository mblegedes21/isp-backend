<x-app-layout>
    <x-slot name="header">Ticket Pekerjaan</x-slot>

    @php
        $demoTickets = is_array($demoTickets ?? null) ? $demoTickets : [
            ['id' => 1, 'code' => 'TK-001', 'status' => 'Belum Dikerjakan', 'progress' => 0, 'materials' => 'ONU Model X, Splitter 1:8'],
            ['id' => 2, 'code' => 'TK-002', 'status' => 'Sedang Dikerjakan', 'progress' => 45, 'materials' => 'Kabel Drop (m)'],
            ['id' => 3, 'code' => 'TK-003', 'status' => 'Belum Selesai', 'progress' => 80, 'materials' => 'ODP 8 Port'],
        ];
    @endphp

    <div class="bg-white rounded-lg shadow p-4">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="text-left text-gray-600 border-b">
                    <tr>
                        <th class="py-2">Ticket</th>
                        <th class="py-2">Status</th>
                        <th class="py-2">Progress</th>
                        <th class="py-2">Material Dibawa</th>
                        <th class="py-2">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach(($demoTickets ?? []) as $t)
                    <tr class="border-b">
                        <td class="py-2 font-mono">{{ $t['code'] ?? '' }}</td>
                        <td class="py-2">{{ $t['status'] ?? '' }}</td>
                        <td class="py-2">{{ $t['progress'] ?? 0 }}%</td>
                        <td class="py-2">{{ $t['materials'] ?? '' }}</td>
                        <td class="py-2">
                            <a href="{{ route('technician.tickets.show', $t['id'] ?? 0) }}" class="text-indigo-600">Laporkan Progress</a>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</x-app-layout>
