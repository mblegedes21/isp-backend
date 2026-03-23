<x-app-layout>
    <x-slot name="header">Approval Review</x-slot>

    <x-page-header :title="'Review Request '.($request['ticket'] ?? '')" :breadcrumb="'Home / Approvals / Review'">
        <x-slot name="actions">
            <a href="{{ url('#') }}" class="inline-flex items-center px-3 py-2 border rounded">Back</a>
        </x-slot>
    </x-page-header>

    <div class="bg-white shadow rounded-lg p-4">
        <h3 class="text-lg font-semibold mb-2">{{ $request['ticket'] ?? '' }}</h3>
        <p class="text-sm text-gray-500 mb-4">{{ $request['details'] ?? '' }}</p>

        <div class="flex gap-2">
            <button class="px-4 py-2 bg-green-600 text-white rounded">Approve</button>
            <button class="px-4 py-2 bg-red-600 text-white rounded">Reject</button>
        </div>
    </div>
</x-app-layout>
