<x-app-layout>
    <x-slot name="header">Buat Permintaan Material</x-slot>

    @php
        $leaders = is_array($leaders ?? null) ? $leaders : ['Budi', 'Andi', 'Rina'];
        $materials = is_array($materials ?? null) ? $materials : [
            ['sku' => 'ONU-X', 'name' => 'ONU Model X'],
            ['sku' => 'SPL-1:8', 'name' => 'Splitter 1:8'],
            ['sku' => 'ODP-8', 'name' => 'ODP 8 Port'],
        ];
        $jobs = is_array($jobs ?? null) ? $jobs : ['Tarik Kabel', 'Pemasangan Baru', 'Maintenance'];
    @endphp

    <div class="bg-white rounded-lg shadow p-6 max-w-3xl">
        <form method="POST" action="{{ route('technician.permintaan.store') }}">
            @csrf

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Nomor Ticket</label>
                    <input type="text" name="ticket_code" class="mt-1 w-full border rounded px-3 py-2" placeholder="TK-001" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">Jenis Pekerjaan</label>
                    <select name="job" class="mt-1 w-full border rounded px-3 py-2">
                        @foreach(($jobs ?? []) as $job)
                        <option value="{{ $job ?? '' }}">{{ $job ?? '' }}</option>
                        @endforeach
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">Pilih Leader</label>
                    <select name="leader" class="mt-1 w-full border rounded px-3 py-2">
                        @foreach(($leaders ?? []) as $leader)
                        <option value="{{ $leader ?? '' }}">{{ $leader ?? '' }}</option>
                        @endforeach
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">Material Request</label>
                    <div class="flex gap-2">
                        <select name="materials[0][product_id]" class="flex-1 border rounded px-3 py-2">
                            @foreach(($materials ?? []) as $m)
                            <option value="{{ $m['sku'] ?? '' }}">{{ $m['sku'] ?? '' }} - {{ $m['name'] ?? '' }}</option>
                            @endforeach
                        </select>
                        <input type="number" name="materials[0][qty]" class="w-24 border rounded px-3 py-2" placeholder="Qty" min="1" />
                    </div>
                </div>
            </div>

            <div class="mt-6">
                <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded">Kirim ke Leader</button>
            </div>
        </form>
    </div>
</x-app-layout>
