<x-app-layout>
    <x-slot name="header">Requests</x-slot>

    <x-page-header :title="'Requests'" :breadcrumb="'Home / Requests'">
        <x-slot name="actions">
            <a href="{{ url('#') }}" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded">Create Request</a>
        </x-slot>
    </x-page-header>

    <div class="bg-white shadow rounded-lg p-4">
        <div class="overflow-x-auto">
            @if(!empty($requests))
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Request No</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Ticket</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Technician</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    @foreach([] as $r)
                    <tr>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $r['no'] }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $r['ticket'] }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $r['technician'] }}</td>
                        <td class="px-4 py-3 text-sm">
                            <span class="px-2 py-1 rounded text-xs font-medium {{ $r['status']=='Open' ? 'bg-yellow-100 text-yellow-800' : ($r['status']=='Approved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800') }}">{{ $r['status'] }}</span>
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $r['date'] }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700">
                            <a href="{{ url('#') }}" class="text-blue-600">View</a>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
            @else
            <div class="text-center py-8 text-gray-500">No requests found.</div>
            @endif
        </div>
    </div>
</x-app-layout>


