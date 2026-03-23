<x-app-layout>
    <x-slot name="header">Approvals</x-slot>

    <x-page-header :title="'Approvals'" :breadcrumb="'Home / Approvals'">
        <x-slot name="actions">
            <a href="#" class="inline-flex items-center px-4 py-2 border rounded">Filters</a>
        </x-slot>
    </x-page-header>

    <div class="bg-white shadow rounded-lg p-4">
        @if(!empty($approvals))
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">#</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Ticket</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Requester</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    @foreach([] as $a)
                    <tr>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $a['id'] }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $a['ticket'] }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $a['requester'] }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $a['date'] }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $a['status'] }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700"><a href="{{ url('#') }}" class="text-blue-600">Review</a></td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @else
        <div class="text-center py-8 text-gray-500">No approvals in queue.</div>
        @endif
    </div>
</x-app-layout>


