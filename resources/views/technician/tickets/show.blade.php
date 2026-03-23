<x-app-layout>
    <x-slot name="header">Detail Ticket</x-slot>

    @php
        $ticket = is_array($ticket ?? null) ? $ticket : [
            'id' => 1,
            'code' => 'TK-001',
            'job' => 'Tarik Kabel',
            'leader' => 'Budi',
            'status' => 'Sedang Dikerjakan',
            'location' => 'Cabang A',
        ];

        $materials = is_array($materials ?? null) ? $materials : [
            ['sku' => 'ONU-X', 'name' => 'ONU Model X', 'qty' => 1],
            ['sku' => 'SPL-1:8', 'name' => 'Splitter 1:8', 'qty' => 2],
        ];
    @endphp

    <div class="space-y-6">
        <div class="bg-white rounded-lg shadow p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <div class="text-sm text-gray-500">Nomor Ticket</div>
                    <div class="text-lg font-semibold">{{ $ticket['code'] ?? '' }}</div>
                </div>
                <div>
                    <div class="text-sm text-gray-500">Jenis Pekerjaan</div>
                    <div class="text-lg font-semibold">{{ $ticket['job'] ?? '' }}</div>
                </div>
                <div>
                    <div class="text-sm text-gray-500">Leader</div>
                    <div class="text-lg font-semibold">{{ $ticket['leader'] ?? '' }}</div>
                </div>
                <div>
                    <div class="text-sm text-gray-500">Status</div>
                    <div class="text-lg font-semibold">{{ $ticket['status'] ?? '' }}</div>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
            <h3 class="font-semibold mb-3">Upload Foto Progress</h3>
            <input type="file" class="border rounded px-3 py-2 w-full" />
        </div>

        <div class="bg-white rounded-lg shadow p-4">
            <h3 class="font-semibold mb-3">Input Penggunaan Material</h3>
            <div class="space-y-2">
                @foreach(($materials ?? []) as $m)
                <div class="flex items-center justify-between border rounded px-3 py-2">
                    <div>{{ $m['sku'] ?? '' }} - {{ $m['name'] ?? '' }}</div>
                    <input type="number" class="w-24 border rounded px-2 py-1" min="0" placeholder="{{ $m['qty'] ?? 0 }}" />
                </div>
                @endforeach
            </div>
        </div>

        <div class="flex justify-end">
            <form method="POST" action="{{ route('technician.tickets.close', $ticket['id'] ?? 0) }}">
                @csrf
                <button type="submit" class="px-4 py-2 bg-red-600 text-white rounded">Tutup Ticket</button>
            </form>
        </div>
    </div>
</x-app-layout>
