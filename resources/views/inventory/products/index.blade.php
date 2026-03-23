<x-app-layout>
    <x-slot name="header">Products</x-slot>

    <x-page-header :title="'Products'" :breadcrumb="'Home / Inventory / Products'">
        <x-slot name="actions">
            <a href="{{ url('#') }}" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded">Add Product</a>
        </x-slot>
    </x-page-header>

    <div class="bg-white shadow rounded-lg p-4">
        @if(!empty($products))
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Stock</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    @foreach([] as $p)
                    <tr>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $p['sku'] }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $p['name'] }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $p['stock'] }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700"><a href="{{ url('#') }}" class="text-blue-600">Edit</a></td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @else
        <div class="text-center py-8 text-gray-500">No products available.</div>
        @endif
    </div>
</x-app-layout>


