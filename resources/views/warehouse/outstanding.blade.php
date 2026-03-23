<x-app-layout>
    <x-slot name="header">Outstanding</x-slot>

    <x-page-header :title="'Outstanding Serials'" :breadcrumb="'Home / Warehouse / Outstanding'">
        <x-slot name="actions">
            <a href="#" class="inline-flex items-center px-3 py-2 border rounded">Send Reminder</a>
        </x-slot>
    </x-page-header>

    <div class="bg-white shadow rounded-lg p-4">
        <div class="overflow-x-auto">
            @if(!empty($outstanding))
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Serial</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Age</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Location</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    @foreach([] as $o)
                    <tr>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $o['serial'] }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $o['product'] }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $o['age'] }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $o['location'] }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700"><button class="px-2 py-1 text-sm bg-yellow-100 rounded">Remind</button></td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
            @else
            <div class="text-center py-8 text-gray-500">No outstanding serials.</div>
            @endif
        </div>
    </div>
</x-app-layout>

