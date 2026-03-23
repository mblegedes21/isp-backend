<x-app-layout>
    <x-page-header :title="'Reports'" :breadcrumb="'Home / Reports'">
        <x-slot name="actions">
            <a href="#" class="inline-flex items-center px-3 py-2 border rounded">Export</a>
        </x-slot>
    </x-page-header>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        @foreach([] as $c)
        <div class="bg-white shadow rounded-lg p-4">
            <h4 class="text-sm text-gray-500">{{ $c['title'] }}</h4>
            <div class="mt-2 text-2xl font-semibold">{{ $c['value'] }}</div>
            <p class="text-sm text-gray-400 mt-2">{{ $c['desc'] }}</p>
        </div>
        @endforeach
    </div>
</x-app-layout>

