<x-app-layout>
    <x-slot name="header">Create Request</x-slot>

    <x-page-header :title="'Create Request'" :breadcrumb="'Home / Requests / Create'">
        <x-slot name="actions">
            <a href="{{ url('#') }}" class="inline-flex items-center px-3 py-2 border rounded">Back to list</a>
        </x-slot>
    </x-page-header>

    <div class="bg-white shadow rounded-lg p-4">
        <form>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="text-sm text-gray-600">Ticket</label>
                    <input class="w-full border rounded px-3 py-2" />
                </div>
                <div>
                    <label class="text-sm text-gray-600">Technician</label>
                    <input class="w-full border rounded px-3 py-2" />
                </div>
            </div>

            <div class="mb-4">
                <h3 class="font-semibold mb-2">Items</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            @foreach([] as $it)
                            <tr>
                                <td class="px-4 py-3 text-sm text-gray-700">{{ $it['sku'] }}</td>
                                <td class="px-4 py-3 text-sm text-gray-700">{{ $it['description'] }}</td>
                                <td class="px-4 py-3 text-sm text-gray-700">{{ $it['qty'] }}</td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="flex justify-end">
                <button type="button" class="px-4 py-2 bg-blue-600 text-white rounded">Save Request</button>
            </div>
        </form>
    </div>
</x-app-layout>


