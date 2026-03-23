<x-app-layout>
    <x-slot name="header">Import Serials</x-slot>

    <x-page-header :title="'Import Serials'" :breadcrumb="'Home / Inventory / Serials / Import'">
        <x-slot name="actions">
            <a href="{{ url('#') }}" class="inline-flex items-center px-3 py-2 border rounded">Back</a>
        </x-slot>
    </x-page-header>

    <div class="bg-white shadow rounded-lg p-4">
        <x-serial-input />
        <div class="flex justify-end mt-4">
            <button class="px-4 py-2 bg-blue-600 text-white rounded">Import</button>
        </div>
    </div>
</x-app-layout>
