<x-app-layout>
    <x-slot name="header">Banding Kasus - {{ '' }}</x-slot>

    <div class="space-y-4">
        <div class="bg-white rounded-lg shadow p-4">
            <div class="text-sm text-gray-500">Case: {{ '' }}</div>
            <div class="font-medium">Project: PRJ-0999</div>
        </div>

        <form method="POST" action="{{ url('#') }}" enctype="multipart/form-data">
            @csrf
            <div class="bg-white rounded-lg shadow p-4">
                <label class="text-sm font-medium">Penjelasan Banding</label>
                <textarea name="explanation" class="mt-1 w-full border rounded px-2 py-2" rows="4"></textarea>

                <label class="text-sm font-medium mt-2">Upload Foto Bukti</label>
                <input type="file" name="photos[]" multiple class="mt-1" />
            </div>

            <div class="flex justify-end mt-3">
                <a href="{{ url('#') }}" class="px-3 py-2 bg-gray-200 rounded">Batal</a>
                <button type="submit" class="ml-2 px-3 py-2 bg-indigo-600 text-white rounded">Ajukan Banding</button>
            </div>
        </form>
    </div>
</x-app-layout>


