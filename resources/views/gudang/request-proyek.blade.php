<x-app-layout>
    <x-slot name="header">Request Proyek</x-slot>

    <div class="space-y-3">
        @foreach([] as $r)
        <div class="bg-white rounded-lg shadow p-4">
            <div class="flex justify-between items-start">
                <div>
                    <div class="text-sm text-gray-500">#{{ $r['id'] }} — {{ $r['date'] ?? '' }}</div>
                    <div class="font-medium">{{ $r['type'] }} — {{ $r['teknisi'] }}</div>
                    <div class="text-sm text-gray-500">Leader: {{ $r['leader'] }} • Lokasi: {{ $r['lokasi'] }}</div>
                </div>
                <div class="text-right">
                    <div class="text-xs px-2 py-1 rounded {{ $r['status']=='Menunggu Gudang' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800' }}">{{ $r['status'] }}</div>
                </div>
            </div>

            <div class="mt-3 space-y-2">
                <div class="text-sm font-medium">Produk:</div>
                @foreach($r['products'] as $p)
                <div class="flex justify-between items-center border rounded px-3 py-2">
                    <div class="text-sm">{{ $p['name'] }}</div>
                    <div class="text-sm text-gray-700">{{ $p['qty'] }}</div>
                </div>
                @endforeach
            </div>

            <div class="mt-3 flex justify-end space-x-2">
                <a href="{{ url('#') }}" class="px-3 py-2 bg-gray-100 rounded">Lihat Detail</a>
                <button class="px-3 py-2 bg-green-600 text-white rounded">Approve</button>
            </div>
        </div>
        @endforeach
    </div>
</x-app-layout>


