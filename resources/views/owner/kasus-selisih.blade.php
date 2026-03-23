<x-app-layout>
    <x-slot name="header">Kasus Selisih</x-slot>

    <div class="space-y-3">
        @php $cases = session('sim_cases', [ ['case_id'=>'KS-0001','project_id'=>'PRJ-0999','lokasi'=>'Pusat','leader'=>'Leader B','teknisi'=>'Rina','selisih_qty'=>2,'selisih_rp'=>2500000,'status'=>'Menunggu Review'] ]); @endphp

        @foreach([] as $c)
        <div class="bg-white rounded-lg shadow p-4">
            <div class="flex justify-between">
                <div>
                    <div class="text-sm text-gray-500">Case: {{ $c['case_id'] }} — Project: {{ $c['project_id'] }}</div>
                    <div class="font-medium">Lokasi: {{ $c['lokasi'] }} — Leader: {{ $c['leader'] }}</div>
                </div>
                <div class="text-right">
                    <div>Selisih: <span class="font-medium">{{ $c['selisih_qty'] }}</span></div>
                    <div>Nilai: <span class="font-medium">Rp {{ number_format($c['selisih_rp'],0,',','.') }}</span></div>
                    <div class="mt-2"><a href="{{ url('#') }}" class="px-3 py-1 bg-gray-100 rounded">Detail</a></div>
                </div>
            </div>
        </div>
        @endforeach
    </div>
</x-app-layout>


