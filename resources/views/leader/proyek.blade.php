<x-app-layout>
    <x-slot name="header">Proyek Aktif</x-slot>

    <div class="space-y-3">
        @foreach([] as $p)
        <div class="bg-white rounded-lg shadow p-4">
            <div class="flex items-center justify-between">
                <div>
                    <div class="text-sm text-gray-500">{{ $p['id'] }}</div>
                    <div class="font-medium">Teknisi: {{ $p['technician'] }}</div>
                </div>
                <div class="text-right">
                    <div>Issued: <span class="font-medium">{{ $p['issued'] }}</span></div>
                    <div>Returned: <span class="font-medium">{{ $p['returned'] }}</span></div>
                    <div>Selisih: <span class="font-medium">{{ $p['diff'] }}</span></div>
                </div>
            </div>

            <div class="mt-3 flex justify-end">
                <button class="px-3 py-2 bg-blue-600 text-white rounded">Selesaikan Proyek</button>
            </div>
        </div>
        @endforeach
    </div>
</x-app-layout>

