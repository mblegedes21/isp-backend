<x-app-layout>
    <x-slot name="header">Kasus Selisih (Leader)</x-slot>

    <div class="space-y-3">
        @php $cases = [ ['case_id'=>'KS-0001','project_id'=>'PRJ-0999','lokasi'=>'Pusat','status'=>'Menunggu Review'] ]; @endphp
        @foreach([] as $c)
        <div class="bg-white rounded-lg shadow p-4">
            <div class="flex justify-between">
                <div>
                    <div class="text-sm text-gray-500">{{ $c['case_id'] }} — {{ $c['project_id'] }}</div>
                </div>
                <div>
                    <a href="{{ url('#') }}" class="px-3 py-1 bg-gray-100 rounded">Detail</a>
                </div>
            </div>
        </div>
        @endforeach
    </div>
</x-app-layout>


