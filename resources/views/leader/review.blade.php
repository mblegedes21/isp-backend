<x-app-layout>
    <x-slot name="header">Review Permintaan</x-slot>

    <div class="space-y-3">
        @foreach([] as $r)
        <div class="bg-white rounded-lg shadow p-4">
            <div class="flex items-start justify-between">
                <div>
                    <div class="text-sm text-gray-500">{{ $r['date'] }} — #{{ $r['id'] }}</div>
                    <div class="font-medium">{{ $r['type'] }} — {{ $r['technician'] }}</div>
                </div>
                <div class="space-x-2">
                    <button class="px-3 py-1 bg-red-100 text-red-700 rounded text-sm">Tolak</button>
                    <button class="px-3 py-1 bg-green-600 text-white rounded text-sm">Setujui</button>
                </div>
            </div>

            <div class="mt-3">
                <h4 class="text-sm font-medium">Material</h4>
                <div class="mt-2 space-y-2">
                    @foreach($r['items'] as $it)
                    <div class="flex items-center justify-between border rounded px-3 py-2">
                        <div>{{ $it['name'] }}</div>
                        <div class="text-sm text-gray-600">Qty: {{ $it['qty'] }}</div>
                    </div>
                    @endforeach
                </div>
            </div>
        </div>
        @endforeach
    </div>
</x-app-layout>

