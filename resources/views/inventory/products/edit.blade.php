<x-app-layout>
    <x-slot name="header">Edit Product #{{ $product['id'] ?? '' }}</x-slot>

    <x-page-header :title="'Edit Product'" :breadcrumb="'Home / Inventory / Products / Edit'">
        <x-slot name="actions">
            <a href="{{ url('#') }}" class="inline-flex items-center px-3 py-2 border rounded">Back</a>
        </x-slot>
    </x-page-header>

    <div class="bg-white shadow rounded-lg p-4">
        <form>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="text-sm text-gray-600">SKU</label>
                    <input class="w-full border rounded px-3 py-2" value="{{ $product['sku'] ?? '' }}" />
                </div>
                <div>
                    <label class="text-sm text-gray-600">Name</label>
                    <input class="w-full border rounded px-3 py-2" value="{{ $product['name'] ?? '' }}" />
                </div>
            </div>
            <div class="flex justify-end">
                <button class="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
        </form>
    </div>
</x-app-layout>
