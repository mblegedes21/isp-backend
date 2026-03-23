<x-app-layout>
    <x-slot name="header">Warehouse - Return</x-slot>

    <x-page-header :title="'Return Items'" :breadcrumb="'Home / Warehouse / Return'">
        <x-slot name="actions">
            <a href="{{ url('#') }}" class="inline-flex items-center px-3 py-2 border rounded">Issue</a>
        </x-slot>
    </x-page-header>

    <div class="bg-white shadow rounded-lg p-4">
        <div class="mb-4">
            <h4 class="font-medium mb-2">Scan/Enter Serials</h4>
            <x-serial-input />
        </div>

        <div class="mt-6">
            <h4 class="font-medium mb-2">Recent Returns</h4>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Serial</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        @foreach([] as $r)
                        <tr>
                            <td class="px-4 py-3 text-sm text-gray-700">{{ $r['serial'] }}</td>
                            <td class="px-4 py-3 text-sm text-gray-700">{{ $r['product'] }}</td>
                            <td class="px-4 py-3 text-sm text-gray-700">{{ $r['date'] }}</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>

        <div class="flex justify-end mt-4">
            <button class="px-4 py-2 bg-blue-600 text-white rounded">Process Return</button>
        </div>
    </div>
</x-app-layout>


