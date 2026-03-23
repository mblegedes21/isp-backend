<x-app-layout>
    <x-slot name="header">Detail Kasus Selisih - {{ '' }}</x-slot>

    <div class="space-y-4">
        <div class="bg-white rounded-lg shadow p-4">
            <div class="text-sm text-gray-500">Case: {{ '' }}</div>
            <div class="font-medium">Project: PRJ-0999 — Lokasi: {{ session('active_location','Pusat') }}</div>
            <div class="text-sm text-gray-500">Leader: Leader B • Teknisi: Rina</div>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
            <h4 class="font-medium">Ringkasan</h4>
            <div class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <div class="text-sm text-gray-500">Barang Keluar</div>
                    <ul class="list-disc ml-4">
                        <li>ONU Model X — 5</li>
                        <li>Splitter 1:8 — 3</li>
                    </ul>
                </div>
                <div>
                    <div class="text-sm text-gray-500">Barang Kembali</div>
                    <ul class="list-disc ml-4">
                        <li>ONU Model X — 3</li>
                        <li>Splitter 1:8 — 2</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
            <h4 class="font-medium">Foto Bukti</h4>
            <div class="mt-2 grid grid-cols-2 gap-3">
                <div class="border p-2">Foto Leader (placeholder)</div>
                <div class="border p-2">Foto Gudang (placeholder)</div>
            </div>
        </div>

        <div class="flex justify-end space-x-2">
            <form method="POST" action="{{ url('#') }}">@csrf
                <button name="action" value="accept" class="px-3 py-2 bg-green-600 text-white rounded">Terima Verifikasi Gudang</button>
                <button name="action" value="clarify" class="ml-2 px-3 py-2 bg-yellow-500 text-white rounded">Minta Klarifikasi</button>
            </form>
        </div>
    </div>
</x-app-layout>


