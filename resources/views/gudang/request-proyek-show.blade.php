<x-app-layout>
    <x-slot name="header">Detail Request Proyek</x-slot>

    <div class="space-y-4" x-data="requestApproval()">
        <div class="bg-white rounded-lg shadow p-4">
            <div class="text-sm text-gray-500">Nomor Proyek: {{ $project['id'] }}</div>
            <div class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                    <div class="text-sm text-gray-500">Leader</div>
                    <div class="font-medium">{{ $project['leader'] }}</div>
                </div>
                <div>
                    <div class="text-sm text-gray-500">Teknisi</div>
                    <div class="font-medium">{{ $project['teknisi'] }}</div>
                </div>
                <div>
                    <div class="text-sm text-gray-500">Jenis Pekerjaan</div>
                    <div class="font-medium">{{ $project['type'] }}</div>
                </div>
                <div>
                    <div class="text-sm text-gray-500">Lokasi</div>
                    <div class="font-medium">{{ $project['lokasi'] }}</div>
                </div>
            </div>

            <div class="mt-4">
                <h4 class="font-medium">Material</h4>
                <div class="mt-2 space-y-2">
                    <template x-for="m in items" :key="m.name">
                        <div class="flex justify-between items-center border rounded px-3 py-2"
                            :class="isInsufficientStock(m) ? 'bg-red-50 border-l-4 border-red-400' : ''">
                            <div>
                                <div class="font-medium" x-text="m.name"></div>
                                <div class="text-sm text-gray-500">
                                    Qty Disetujui: <span x-text="m.qty_disetujui"></span> •
                                    Stok Saat Ini: <span x-text="m.stok_saat_ini"></span>
                                    <span x-show="isInsufficientStock(m)" class="ml-2 text-red-600 font-medium">
                                        (Kurang: <span x-text="m.qty_disetujui - m.stok_saat_ini"></span>)
                                    </span>
                                </div>
                            </div>
                            <div class="text-sm" x-text="formatCurrency(m.price * m.qty_disetujui)"></div>
                        </div>
                    </template>
                </div>
            </div>
        </div>

        <div class="mt-4 flex justify-end space-x-2">
            <button class="px-3 py-2 bg-gray-200 rounded">Batal</button>

            <button x-show="hasInsufficientStock()"
                @click="openPurchaseModal = true"
                class="px-3 py-2 bg-red-600 text-white rounded">
                Stok Tidak Cukup
            </button>

            <button x-show="isStockEnough()"
                @click="openApproveModal = true"
                class="px-3 py-2 bg-green-600 text-white rounded">
                Approve & Cetak Barang Keluar
            </button>
        </div>
    </div>

    <!-- Purchase Modal -->
    <div x-show="openPurchaseModal" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow p-6 w-full max-w-md">
            <div class="font-semibold text-lg">Stok Tidak Mencukupi</div>
            <div class="text-sm text-gray-600 mt-3">
                Stok tidak mencukupi.
                Project akan dibatalkan dan Form Pembelian akan dibuat.
            </div>

            <div class="mt-6 flex justify-end space-x-2">
                <button @click="openPurchaseModal = false"
                    class="px-4 py-2 bg-gray-200 rounded">
                    Batal
                </button>

                <form method="POST"
                    action="{{ \Illuminate\Support\Facades\Route::has('gudang.request-proyek.create-purchase')
                        ? url('#')
                        : url('/gudang/pembelian/create?project=' . ($project['id'] ?? '')) }}"
                    class="inline">
                    @csrf
                    <button type="submit" class="px-4 py-2 bg-red-600 text-white rounded">
                        Lanjutkan ke Form Pembelian
                    </button>
                </form>
            </div>
        </div>
    </div>

    <!-- Approve Modal -->
    <div x-show="openApproveModal" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow p-6 w-full max-w-md">
            <div class="font-semibold text-lg">Konfirmasi Approval</div>
            <div class="text-sm text-gray-600 mt-3">
                Semua stok mencukupi.
                Project akan disetujui dan laporan barang keluar akan dicetak.
            </div>

            <div class="mt-6 flex justify-end space-x-2">
                <button @click="openApproveModal = false"
                    class="px-4 py-2 bg-gray-200 rounded">
                    Batal
                </button>

                <form method="POST"
                    action="{{ \Illuminate\Support\Facades\Route::has('gudang.request-proyek.approve')
                        ? url('#')
                        : url('/gudang/request-proyek/' . ($project['id'] ?? '') . '/approve') }}"
                    class="inline">
                    @csrf
                    <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded">
                        Approve & Cetak
                    </button>
                </form>
            </div>
        </div>
    </div>

    <script>
        function requestApproval() {
            return {
                items: @json($project['materials'] ?? []),
                openPurchaseModal: false,
                openApproveModal: false,

                isInsufficientStock(item) {
                    return parseFloat(item.stok_saat_ini) < parseFloat(item.qty_disetujui);
                },

                isStockEnough() {
                    return this.items.every(it =>
                        parseFloat(it.stok_saat_ini) >= parseFloat(it.qty_disetujui)
                    );
                },

                hasInsufficientStock() {
                    return !this.isStockEnough();
                },

                formatCurrency(v) {
                    return 'Rp ' + new Intl.NumberFormat('id-ID').format(v);
                }
            }
        }
    </script>
</x-app-layout>
