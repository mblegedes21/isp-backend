<x-app-layout>
    <x-slot name="header">Permintaan Barang</x-slot>

    @php
        $requests = is_array($requests ?? null) ? $requests : [
            ['id' => 1, 'ticket' => 'TK-010', 'leader' => 'Budi', 'materials' => 'ONU Model X (2), Splitter 1:8 (1)'],
            ['id' => 2, 'ticket' => 'TK-011', 'leader' => 'Andi', 'materials' => 'Kabel Drop (m) (50)'],
        ];
    @endphp

    <div class="bg-white rounded-lg shadow p-4">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="text-left text-gray-600 border-b">
                    <tr>
                        <th class="py-2">Ticket</th>
                        <th class="py-2">Leader</th>
                        <th class="py-2">Material Diminta</th>
                        <th class="py-2">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach(($requests ?? []) as $r)
                    <tr class="border-b">
                        <td class="py-2 font-mono">{{ $r['ticket'] ?? '' }}</td>
                        <td class="py-2">{{ $r['leader'] ?? '' }}</td>
                        <td class="py-2">{{ $r['materials'] ?? '' }}</td>
                        <td class="py-2">
                            <a href="{{ route('gudang.permintaan.approve', $r['id'] ?? 0) }}" class="text-indigo-600">Approve Keluar Barang</a>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</x-app-layout>
