<x-app-layout>
    <x-page-header :title="'Serial Batch #' . ($batch['id'] ?? $id)" :breadcrumb="'Home / Inventory / Serials / Batch'">
        <x-slot name="actions">
            <a href="{{ url('#') }}" class="inline-flex items-center px-3 py-2 border rounded">Back</a>
        </x-slot>
    </x-page-header>

    <div class="bg-white shadow rounded-lg p-4">
        <div class="mb-4">
            <h3 class="text-lg font-semibold">Batch: {{ $batch['id'] ?? $id }}</h3>
            <p class="text-sm text-gray-500">Product: {{ $batch['product'] ?? '—' }} • Count: {{ $batch['count'] ?? '-' }}</p>
        </div>

        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Serial</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Location</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    @for($i=1;$i<=min(10, $batch['count'] ?? 0); $i++)
                        <tr>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ 'SN-' . ($batch['id'] ?? $id) . sprintf('%05d', $i) }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700">Available</td>
                        <td class="px-4 py-3 text-sm text-gray-700">Pusat</td>
                        </tr>
                        @endfor
                </tbody>
            </table>
        </div>
    </div>
</x-app-layout>
