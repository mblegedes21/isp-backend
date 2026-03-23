<x-app-layout>
    <x-page-header :title="'Dashboard'" :breadcrumb="'Home / Dashboard'">
        <x-slot name="actions">
            <a href="{{ url('#') }}" class="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded">New Request</a>
        </x-slot>
    </x-page-header>

    <div class="space-y-6">
        <!-- KPI cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            @foreach([] as $k)
            <div class="bg-white shadow rounded-lg p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-sm text-gray-500">{{ $k['label'] }}</h3>
                        <div class="mt-2 text-2xl font-semibold text-gray-800">{{ $k['value'] }}</div>
                    </div>
                    <div class="text-gray-300">
                        <!-- placeholder icon -->
                        <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7h18M3 12h18M3 17h18" />
                        </svg>
                    </div>
                </div>
            </div>
            @endforeach
        </div>

        <!-- Two-column content -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Recent Requests -->
            <div class="bg-white shadow rounded-lg p-4">
                <h2 class="text-lg font-semibold mb-3">Recent Requests</h2>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">#</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Title</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Requester</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            @foreach([] as $r)
                            <tr>
                                <td class="px-4 py-3 text-sm text-gray-700">{{ $r['id'] }}</td>
                                <td class="px-4 py-3 text-sm text-gray-700">{{ $r['title'] }}</td>
                                <td class="px-4 py-3 text-sm text-gray-700">{{ $r['requester'] }}</td>
                                <td class="px-4 py-3 text-sm">
                                    <span class="px-2 py-1 rounded text-xs font-medium {{ $r['status']=='Open' ? 'bg-yellow-100 text-yellow-800' : ( $r['status']=='Approved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800') }}">{{ $r['status'] }}</span>
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-700">{{ $r['date'] }}</td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Outstanding Serials -->
            <div class="bg-white shadow rounded-lg p-4">
                <h2 class="text-lg font-semibold mb-3">Outstanding Serials</h2>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Serial</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Age</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Location</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            @foreach([] as $s)
                            <tr>
                                <td class="px-4 py-3 text-sm text-gray-700">{{ $s['serial'] }}</td>
                                <td class="px-4 py-3 text-sm text-gray-700">{{ $s['product'] }}</td>
                                <td class="px-4 py-3 text-sm text-gray-700">{{ $s['age'] }}</td>
                                <td class="px-4 py-3 text-sm text-gray-700">{{ $s['location'] }}</td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Inventory Summary -->
        <div class="bg-white shadow rounded-lg p-4">
            <h2 class="text-lg font-semibold mb-3">Inventory Summary</h2>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Stock</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Reserved</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        @foreach([] as $i)
                        <tr>
                            <td class="px-4 py-3 text-sm text-gray-700">{{ $i['product'] }}</td>
                            <td class="px-4 py-3 text-sm text-gray-700">{{ $i['stock'] }}</td>
                            <td class="px-4 py-3 text-sm text-gray-700">{{ $i['reserved'] }}</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</x-app-layout>


