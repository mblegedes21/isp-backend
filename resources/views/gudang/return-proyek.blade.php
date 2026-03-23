<x-app-layout>
    <x-slot name="header">Return Proyek</x-slot>

    <div class="space-y-3">
        @foreach([] as $r)
        <div class="bg-white rounded-lg shadow p-4">
            <div class="flex justify-between items-start">
                <div>
                    <div class="text-sm text-gray-500">#{{ $r['id'] }} • {{ $r['lokasi'] ?? '' }}</div>
                    <div class="font-medium mt-1">Leader: {{ $r['leader'] }} • Teknisi: {{ $r['teknisi'] }}</div>
                    <div class="text-sm text-gray-500 mt-2">Ringkasan: {{ count($r['items']) }} item</div>
                </div>
                <div class="text-right">
                    <div>Selisih: <span class="font-medium text-red-600">{{ $r['selisih'] }}</span></div>
                    <div class="mt-1">Potensi Kerugian: <span class="font-medium">Rp {{ number_format($r['nilai_rp'],0,',','.') }}</span></div>
                    <div class="mt-3 flex justify-end space-x-2">
                        <a href="{{ url('#') }}" target="_blank" class="px-3 py-2 bg-gray-100 rounded">Cetak (A4)</a>
                        <a href="{{ url('#') }}" class="px-3 py-2 bg-indigo-600 text-white rounded">Verifikasi Return</a>
                    </div>
                </div>
            </div>

            <div class="mt-3">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    @foreach($r['items'] as $it)
                    <div class="border rounded p-2 text-sm">
                        <div class="font-medium">{{ $it['name'] }}</div>
                        <div class="text-gray-600">Keluar: {{ $it['qty_keluar'] }} {{ $it['satuan'] }} • Kembali: {{ $it['qty_kembali'] }} {{ $it['satuan'] }}</div>
                    </div>
                    @endforeach
                </div>
            </div>
        </div>
        @endforeach
    </div>
</x-app-layout>


