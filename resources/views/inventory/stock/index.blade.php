<x-app-layout>
    <x-page-header :title="'Stock Overview'" :breadcrumb="'Home / Inventory / Stock'">
        <x-slot name="actions">
            <a href="{{ url('#') }}" class="inline-flex items-center px-3 py-2 border rounded">Products</a>
        </x-slot>
    </x-page-header>

    <div class="bg-white shadow rounded-lg p-4">
        <div class="mb-4">
            <label class="text-sm text-gray-600">Filter</label>
            <input class="ml-2 border rounded px-2 py-1" placeholder="Product or Location" />
        </div>

        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Location</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Stock</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    @foreach([] as $l)
                    <tr>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $l['location'] }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $l['product'] }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $l['stock'] }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</x-app-layout>


