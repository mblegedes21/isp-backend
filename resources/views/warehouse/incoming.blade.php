<x-app-layout>
    <x-slot name="header">Penerimaan Transfer</x-slot>

    <div class="mb-4">
        <h1 class="text-2xl font-semibold">Penerimaan Transfer</h1>
        <p class="text-sm text-gray-500">Daftar transfer yang sedang dalam pengiriman</p>
    </div>

    <div class="bg-white shadow rounded-lg p-6">
        <div class="space-y-4">
            @foreach([] as $t)
            <div class="border rounded p-4">
                <div class="flex justify-between items-center">
                    <div>
                        <div class="font-medium">{{ $t['id'] }} — Dari: {{ $t['from'] }} ke: {{ $t['to'] }}</div>
                        <div class="text-sm text-gray-500">{{ $t['date'] }}</div>
                    </div>
                    <div>
                        <button @click="" class="px-3 py-2 bg-gray-100 rounded">Scan & Konfirmasi</button>
                    </div>
                </div>

                <div class="mt-3">
                    <h4 class="text-sm font-medium">Daftar Serial</h4>
                    <div class="mt-2 space-y-2">
                        @foreach($t['items'] as $it)
                        <div class="flex items-center justify-between border rounded px-3 py-2">
                            <div class="font-mono">{{ '' }}</div>
                            <div><span class="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Menunggu</span></div>
                        </div>
                        @endforeach
                    </div>
                </div>
            </div>
            @endforeach
        </div>
    </div>
</x-app-layout>

