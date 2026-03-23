<x-app-layout>
    <x-slot name="header">Buat Ticket Pekerjaan</x-slot>

    <div class="bg-white rounded-lg shadow p-4">
        <form method="POST" action="{{ route('technician.tickets.store') }}">
            @csrf
            <div class="mb-3">
                <label class="text-sm font-medium">Jenis Pekerjaan</label>
                <select name="jenis_pekerjaan" class="mt-1 w-full border rounded px-3 py-2" required>
                    @foreach(\App\Models\Ticket::JENIS_OPTIONS as $o)
                    <option value="{{ '' }}">{{ '' }}</option>
                    @endforeach
                </select>
            </div>
            <div class="mt-4 flex justify-end">
                <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded">Buat</button>
            </div>
        </form>
    </div>
</x-app-layout>

