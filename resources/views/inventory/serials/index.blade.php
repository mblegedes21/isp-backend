<x-app-layout>
    <x-slot name="header">Serials</x-slot>
    <x-app-layout>
        <x-slot name="header">Serials</x-slot>

        <x-page-header :title="'Serials'" :breadcrumb="'Home / Inventory / Serials'">
            <x-slot name="actions">
                <a href="{{ url('#') }}" class="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded">Import</a>
            </x-slot>
        </x-page-header>

        <div class="bg-white shadow rounded-lg p-4">
            <div class="mb-4">
                <label class="text-sm text-gray-600">Filter</label>
                <input class="ml-2 border rounded px-2 py-1" placeholder="Product or Serial" />
            </div>

            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr>
                            <th class="px-4 py-2 text-left">Serial</th>
                            <th class="px-4 py-2 text-left">Product</th>
                            <th class="px-4 py-2 text-left">Location</th>
                            <th class="px-4 py-2 text-left">Status</th>
                            <th class="px-4 py-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white">
                        @foreach([] as $s)
                        <tr>
                            <td class="px-4 py-2">{{ $s['serial'] }}</td>
                            <td class="px-4 py-2">{{ $s['product'] }}</td>
                            <td class="px-4 py-2">{{ $s['location'] }}</td>
                            <td class="px-4 py-2">{{ $s['status'] }}</td>
                            <td class="px-4 py-2 text-right">
                                <a href="#" class="text-blue-600">View</a>
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </x-app-layout>
    @else
    <div class="text-center py-8 text-gray-500">No serials found.</div>
    @endif
    </div>
</x-app-layout>


