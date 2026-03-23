<x-app-layout>
    <x-slot name="header">Transfer Antar Gudang</x-slot>

    @php
        $transfers = is_array($transfers ?? null) ? $transfers : [
            ['id' => 'TRF-001', 'from' => 'Pusat', 'to' => 'Cabang A', 'status' => 'Dikirim'],
            ['id' => 'TRF-002', 'from' => 'Cabang B', 'to' => 'Pusat', 'status' => 'Diterima'],
        ];
    @endphp

    <div class="bg-white rounded-lg shadow p-4">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="text-left text-gray-600 border-b">
                    <tr>
                        <th class="py-2">Transfer</th>
                        <th class="py-2">Dari</th>
                        <th class="py-2">Ke</th>
                        <th class="py-2">Status</th>
                        <th class="py-2">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach(($transfers ?? []) as $t)
                    <tr class="border-b">
                        <td class="py-2 font-mono">{{ $t['id'] ?? '' }}</td>
                        <td class="py-2">{{ $t['from'] ?? '' }}</td>
                        <td class="py-2">{{ $t['to'] ?? '' }}</td>
                        <td class="py-2">{{ $t['status'] ?? '' }}</td>
                        <td class="py-2">
                            <a href="{{ url('#') }}" class="text-indigo-600">Print</a>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</x-app-layout>
