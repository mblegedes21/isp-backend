<x-app-layout>
    <x-slot name="header">Transfer Barang</x-slot>

    <div class="mb-4 flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-semibold">Transfer Barang</h1>
            <nav class="text-sm text-gray-500 mt-1">Home / Gudang / Transfer</nav>
        </div>
    </div>

    <div class="bg-white shadow rounded-lg p-6 mb-6" x-data="transferAction()">
        <form method="POST" x-ref="submitForm" x-data="transferForm()">
            @csrf
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Dari Lokasi</label>
                    <select x-model="from" class="mt-1 block w-full border rounded px-3 py-2">
                        @foreach([] as $loc)
                        <option value="{{ '' }}">{{ '' }}</option>
                        @endforeach
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Ke Lokasi</label>
                    <select x-model="to" class="mt-1 block w-full border rounded px-3 py-2">
                        @foreach([] as $loc)
                        <option value="{{ '' }}">{{ '' }}</option>
                        @endforeach
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Produk</label>
                    <select x-model="product" class="mt-1 block w-full border rounded px-3 py-2">
                        @foreach([] as $p)
                        <option value="{{ $p['sku'] }}">{{ $p['name'] }} ({{ $p['sku'] }})</option>
                        @endforeach
                    </select>
                </div>
            </div>

            <div class="mb-4">
                <h4 class="text-sm font-medium mb-2">Pindai Serial</h4>
                <x-scan-onu />
            </div>

            <div class="flex justify-end space-x-2 mt-6">
                <button
                    type="button"
                    disabled
                    class="px-4 py-2 bg-gray-400 text-white rounded cursor-not-allowed">
                    Print Laporan (Tersedia Setelah Transfer Dibuat)
                </button>

                <button type="button" @click="openSubmitModal = true" class="px-4 py-2 bg-indigo-600 text-white rounded">Ajukan Transfer</button>
            </div>
        </form>

        <!-- Confirmation Modal -->
        <div x-show="openSubmitModal" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow p-6 w-full max-w-md">
                <div class="text-lg font-semibold">
                    Konfirmasi Transfer
                </div>

                <div class="text-sm text-gray-600 mt-2">
                    Transfer akan diajukan dan laporan akan langsung dicetak.
                </div>

                <div class="mt-6 flex justify-end space-x-2">
                    <button
                        @click="openSubmitModal=false"
                        class="px-4 py-2 bg-gray-200 rounded">
                        Batal
                    </button>

                    <button
                        @click="submitAndPrint()"
                        class="px-4 py-2 bg-green-600 text-white rounded">
                        Ajukan & Print
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="bg-white shadow rounded-lg p-6">
        <h3 class="font-medium mb-4">Riwayat Transfer</h3>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="text-left text-gray-600">
                    <tr>
                        <th class="py-2">ID</th>
                        <th class="py-2">Dari</th>
                        <th class="py-2">Ke</th>
                        <th class="py-2">Tanggal</th>
                        <th class="py-2">Status</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach([] as $h)
                    <tr class="border-t">
                        <td class="py-2">{{ $h['id'] }}</td>
                        <td class="py-2">{{ $h['from'] }}</td>
                        <td class="py-2">{{ $h['to'] }}</td>
                        <td class="py-2">{{ $h['date'] }}</td>
                        <td class="py-2">
                            @if($h['status']=='Menunggu Persetujuan')
                            <span class="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Menunggu Persetujuan</span>
                            @elseif($h['status']=='Disetujui')
                            <span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Disetujui</span>
                            @else
                            <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Dalam Pengiriman</span>
                            @endif
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>

    <script>
        function transferAction() {
            return {
                openSubmitModal: false,
                submitAndPrint() {
                    this.$refs.submitForm.action =
                        this.$refs.submitForm.action + '?print=1';
                    this.$refs.submitForm.submit();
                }
            }
        }

        function transferForm() {
            return {
                from: '',
                to: '',
                product: ''
            }
        }
    </script>
</x-app-layout>

