<x-app-layout>
    <x-slot name="header">Request #{{ $request['id'] ?? $id }}</x-slot>

    <x-page-header :title="'Request ' . ($request['ticket'] ?? '')" :breadcrumb="'Home / Requests / '.$request['ticket']">
        <x-slot name="actions">
            <a href="{{ url('#') }}" class="inline-flex items-center px-3 py-2 border rounded">Back</a>
        </x-slot>
    </x-page-header>

    <div class="bg-white shadow rounded-lg p-4">
        <div class="flex items-center justify-between mb-4">
            <div>
                <h3 class="text-lg font-semibold">{{ $request['ticket'] ?? '' }}</h3>
                <p class="text-sm text-gray-500">Requested by: {{ $request['technician'] ?? '' }} • {{ $request['date'] ?? '' }}</p>
            </div>
            <div>
                <span class="px-3 py-1 rounded text-sm font-medium {{ ($request['status'] ?? '')=='Open' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800' }}">{{ $request['status'] ?? '' }}</span>
            </div>
        </div>

        <h4 class="font-medium mb-2">Items</h4>
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Serials</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    @foreach([] as $it)
                    <tr>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $it['sku'] }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $it['description'] }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $it['qty'] }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700">@if(!empty($it['serials'])) {{ implode(', ',$it['serials']) }} @else - @endif</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</x-app-layout>


