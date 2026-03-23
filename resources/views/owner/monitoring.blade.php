<x-app-layout>
    <x-slot name="header">Monitoring Owner</x-slot>

    <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div class="bg-white rounded-lg shadow p-3">
                <div class="text-sm text-gray-500">Total Nilai Aset</div>
                <div class="font-semibold text-lg">Rp {{ number_format($summary['total_aset'],0,',','.') }}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-3">
                <div class="text-sm text-gray-500">Nilai ONU Terpasang</div>
                <div class="font-semibold text-lg">Rp {{ number_format($summary['nilai_onu'],0,',','.') }}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-3">
                <div class="text-sm text-gray-500">Nilai Outstanding Teknisi</div>
                <div class="font-semibold text-lg">Rp {{ number_format($summary['nilai_outstanding'],0,',','.') }}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-3">
                <div class="text-sm text-gray-500">Nilai Material Proyek Aktif</div>
                <div class="font-semibold text-lg">Rp {{ number_format($summary['nilai_proyek'],0,',','.') }}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-3">
                <div class="text-sm text-gray-500">Nilai Dalam Transit</div>
                <div class="font-semibold text-lg">Rp {{ number_format($summary['nilai_transit'],0,',','.') }}</div>
            </div>
        </div>

        <div class="mt-4 space-y-3">
            <div class="bg-white rounded-lg shadow p-4">
                <div class="font-medium mb-2">Breakdown per Lokasi</div>
                <div class="space-y-2">
                    @foreach([] as $l)
                    <div class="flex justify-between">
                        <div>{{ $l['loc'] }}</div>
                        <div>Rp {{ number_format($l['value'],0,',','.') }}</div>
                    </div>
                    @endforeach
                </div>
            </div>

            <div class="bg-white rounded-lg shadow p-4">
                <div class="font-medium mb-2">Breakdown per Leader</div>
                <div class="space-y-2">
                    @foreach([] as $b)
                    <div class="flex justify-between">
                        <div>{{ $b['leader'] }}</div>
                        <div>Rp {{ number_format($b['value'],0,',','.') }}</div>
                    </div>
                    @endforeach
                </div>
            </div>
        </div>
    </div>
</x-app-layout>

