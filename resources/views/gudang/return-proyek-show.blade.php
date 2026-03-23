<x-app-layout>
    <x-slot name="header">Verifikasi Return Proyek</x-slot>

    <div class="space-y-4" x-data="returnVerify()">
        <div class="bg-white rounded-lg shadow p-4">
            <div class="flex items-start justify-between">
                <div>
                    <div class="text-sm text-gray-500">Home / Gudang / Return Proyek</div>
                    <div class="mt-1 font-semibold">
                        Nomor Proyek: {{ $project['id'] ?? '-' }} —
                        Tiket: {{ $project['ticket'] ?? '-' }}
                    </div>
                    <div class="text-sm text-gray-600">
                        Leader: {{ $project['leader'] ?? '-' }} •
                        Teknisi: {{ $project['teknisi'] ?? '-' }} •
                        Lokasi: {{ $project['lokasi'] ?? '-' }}
                    </div>
                </div>

                <div class="space-x-2 text-right">
                    <a target="_blank"
                        href="{{ url('#') }}"
                        class="px-3 py-2 bg-gray-100 rounded">
                        Cetak Berita Acara (A4)
                    </a>

                    <button @click="openConfirm = true"
                        :disabled="hasIncompleteInput()"
                        :class="hasIncompleteInput() ? 'px-3 py-2 bg-gray-400 text-white rounded cursor-not-allowed' : 'px-3 py-2 bg-green-600 text-white rounded'">
                        Konfirmasi Return (Barang Masuk)
                    </button>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
            <div class="flex items-center justify-between">
                <div class="font-medium">Ringkasan</div>
                <div class="text-sm text-gray-600">
                    Status:
                    <span class="px-2 py-1 rounded {{ ($project['selisih_total'] ?? 0) > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800' }}">
                        Menunggu Verifikasi
                    </span>
                </div>
            </div>

            <div class="mt-3 overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="text-left text-gray-600">
                        <tr>
                            <th class="py-2">Nama Material</th>
                            <th class="py-2">Satuan</th>
                            <th class="py-2">Qty Keluar</th>
                            <th class="py-2">Qty Kembali</th>
                            <th class="py-2">Selisih</th>
                            <th class="py-2">Potensi Kerugian</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template x-for="(it, idx) in items" :key="it.sku">
                            <tr class="border-t" :class="formatSelisih(it) > 0 ? 'bg-red-50' : ''">
                                <td class="py-2" x-text="it.name"></td>
                                <td class="py-2" x-text="it.satuan"></td>
                                <td class="py-2" x-text="it.qty_keluar"></td>
                                <td class="py-2">
                                    <div>
                                        <input type="number"
                                            step="any"
                                            x-model.number="it.qty_kembali"
                                            min="0"
                                            :max="it.qty_keluar"
                                            class="w-24 border rounded px-2 py-1 text-sm" />
                                    </div>
                                    <div x-show="isQtyExceeded(it)" class="text-xs text-red-600 mt-1">
                                        Qty kembali tidak boleh melebihi qty keluar
                                    </div>
                                </td>
                                <td class="py-2">
                                    <span x-text="formatSelisih(it)"
                                        :class="formatSelisih(it)>0 ? 'text-red-600 font-medium' : 'text-green-600'">
                                    </span>
                                </td>
                                <td class="py-2">
                                    <span x-text="formatCurrency(subtotal(it))"></span>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>

            <div class="mt-4 flex justify-between items-center">
                <div>
                    <button x-show="totalSelisih()>0"
                        @click="openReport=true"
                        class="px-3 py-2 bg-yellow-500 text-white rounded">
                        Laporkan Selisih
                    </button>
                </div>

                <div class="text-right">
                    <div class="text-sm">
                        Total Selisih:
                        <span class="font-semibold text-red-600" x-text="totalSelisih()"></span>
                    </div>
                    <div class="text-sm">
                        Potensi Kerugian:
                        <span class="font-semibold" x-text="formatCurrency(totalPotensi())"></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Confirm Modal -->
        <div x-show="openConfirm" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow p-4 w-full max-w-md">
                <div class="font-semibold">Konfirmasi Verifikasi Return</div>
                <div class="text-sm text-gray-600 mt-2">
                    Apakah Anda yakin semua barang sudah diverifikasi?
                </div>

                <div x-show="hasSelisih()" class="bg-yellow-100 text-yellow-800 p-3 rounded text-sm mt-3 border border-yellow-300">
                    Return akan dikonfirmasi.
                    Sistem akan membuat laporan selisih otomatis karena terdapat selisih barang.
                </div>

                <div class="mt-4 flex justify-end space-x-2">
                    <button @click="openConfirm=false"
                        class="px-3 py-2 bg-gray-200 rounded">
                        Batal
                    </button>

                    <form method="POST" :action="confirmUrl" class="inline">
                        @csrf
                        <button type="submit"
                            :class="hasSelisih() ? 'px-3 py-2 bg-yellow-600 text-white rounded' : 'px-3 py-2 bg-green-600 text-white rounded'">
                            Ya, Konfirmasi Return
                        </button>
                    </form>
                </div>
            </div>
        </div>

        <!-- Report Modal -->
        <div x-show="openReport" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow p-4 w-full max-w-lg">
                <div class="font-semibold">Laporkan Selisih ke Owner</div>

                <form method="POST"
                    action="{{ url('#') }}"
                    enctype="multipart/form-data">
                    @csrf

                    <div class="mt-3">
                        <label class="text-sm">Catatan Selisih (wajib)</label>
                        <textarea name="note" required
                            class="mt-1 w-full border rounded px-2 py-2"></textarea>
                    </div>

                    <div class="mt-3">
                        <label class="text-sm">Upload Foto Bukti (wajib)</label>
                        <input type="file" name="photos[]" accept="image/*" required class="mt-1" />
                    </div>

                    <div class="mt-3">
                        <div class="text-sm">
                            Total Selisih:
                            <span class="font-semibold text-red-600" x-text="totalSelisih()"></span>
                        </div>
                        <div class="text-sm">
                            Potensi Kerugian:
                            <span class="font-semibold" x-text="formatCurrency(totalPotensi())"></span>
                        </div>
                    </div>

                    <div class="mt-4 flex justify-end">
                        <button type="button"
                            @click="openReport=false"
                            class="px-3 py-2 bg-gray-200 rounded">
                            Batal
                        </button>

                        <button type="submit"
                            class="ml-2 px-3 py-2 bg-yellow-500 text-white rounded">
                            Kirim Kasus ke Owner
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script>
        function returnVerify() {
            return {
                items: @json($project['items'] ?? []),
                openConfirm: false,
                openReport: false,
                confirmUrl: '{{ url('#') }}',

                formatSelisih(it) {
                    const s = (parseFloat(it.qty_keluar) - parseFloat(it.qty_kembali)) || 0;
                    return s > 0 ? s : 0;
                },

                subtotal(it) {
                    const s = Math.max(0, (parseFloat(it.qty_keluar) - parseFloat(it.qty_kembali)) || 0);
                    return s * (parseFloat(it.harga) || 0);
                },

                totalSelisih() {
                    return this.items.reduce((sum, it) =>
                        sum + Math.max(0, (parseFloat(it.qty_keluar) - parseFloat(it.qty_kembali)) || 0),
                        0
                    );
                },

                totalPotensi() {
                    return this.items.reduce((sum, it) =>
                        sum + Math.max(0, (parseFloat(it.qty_keluar) - parseFloat(it.qty_kembali)) || 0) *
                        (parseFloat(it.harga) || 0),
                        0
                    );
                },

                formatCurrency(v) {
                    return 'Rp ' + new Intl.NumberFormat('id-ID').format(v);
                },

                isQtyExceeded(it) {
                    const kembali = parseFloat(it.qty_kembali) || 0;
                    const keluar = parseFloat(it.qty_keluar) || 0;
                    return kembali > keluar;
                },

                hasIncompleteInput() {
                    return this.items.some(it =>
                        it.qty_kembali === null ||
                        it.qty_kembali === '' ||
                        isNaN(parseFloat(it.qty_kembali))
                    );
                },

                hasSelisih() {
                    return this.totalSelisih() > 0;
                }
            }
        }
    </script>
</x-app-layout>
