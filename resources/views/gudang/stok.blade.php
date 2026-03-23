<x-app-layout>
    <x-slot name="header">Inventory Control - Stok Gudang</x-slot>

    <div class="space-y-6" x-data="stockDashboard()">
        <!-- KPI Summary Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white rounded-xl shadow p-4">
                <div class="text-sm text-gray-600 font-medium">Total SKU</div>
                <div class="text-3xl font-bold text-gray-900 mt-2" x-text="products.length"></div>
                <div class="text-xs text-gray-500 mt-1">Produk aktif</div>
            </div>
            <div class="bg-white rounded-xl shadow p-4">
                <div class="text-sm text-gray-600 font-medium">Total Unit</div>
                <div class="text-3xl font-bold text-blue-600 mt-2" x-text="products.reduce((sum, p) => sum + (p.total || 0), 0)"></div>
                <div class="text-xs text-gray-500 mt-1">Unit di gudang</div>
            </div>
            <div class="bg-white rounded-xl shadow p-4">
                <div class="text-sm text-gray-600 font-medium">Total Available</div>
                <div class="text-3xl font-bold text-green-600 mt-2" x-text="products.reduce((sum, p) => sum + available(p), 0)"></div>
                <div class="text-xs text-gray-500 mt-1">Siap digunakan</div>
            </div>
            <div class="bg-white rounded-xl shadow p-4">
                <div class="text-sm text-gray-600 font-medium">Stok Menipis</div>
                <div class="text-3xl font-bold text-red-600 mt-2" x-text="products.filter(p => available(p) < (p.min_stok || 5)).length"></div>
                <div class="text-xs text-gray-500 mt-1">Butuh reorder</div>
            </div>
        </div>

        <!-- Search and Filter Bar -->
        <div class="bg-white rounded-xl shadow p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Cari Produk</label>
                    <input
                        type="text"
                        x-model="search"
                        placeholder="Cari berdasarkan nama produk..."
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Filter Status</label>
                    <select x-model="filterStatus" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                        <option value="all">Semua Status</option>
                        <option value="aman">Aman</option>
                        <option value="menipis">Menipis</option>
                        <option value="habis">Habis</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Alert Section -->
        <div x-show="products.filter(p => available(p) < (p.min_stok || 5)).length > 0" class="bg-red-50 border border-red-200 rounded-xl p-4">
            <div class="flex items-start gap-3">
                <div class="text-xl">⚠️</div>
                <div>
                    <h3 class="font-semibold text-red-900">Ada Stok di Bawah Minimum</h3>
                    <ul class="mt-2 space-y-1 text-sm text-red-800">
                        <template x-for="p in products.filter(p => available(p) < (p.min_stok || 5))" :key="p.name">
                            <li>• <span x-text="p.name"></span>: <span x-text="available(p)"></span> unit (Min: <span x-text="p.min_stok || 5"></span>)</li>
                        </template>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Inventory Table -->
        <div class="flex justify-end mb-4">
            <button
                @click="openReportModal = true"
                class="px-4 py-2 bg-red-600 text-white rounded">
                Kirim Laporan Reorder ke Owner
            </button>
        </div>
        <div class="bg-white rounded-xl shadow overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50 border-b">
                        <tr>
                            <th class="py-3 px-4 text-left font-semibold text-gray-700">Barang</th>
                            <th class="py-3 px-4 text-right font-semibold text-gray-700">Harga</th>
                            <th class="py-3 px-4 text-center font-semibold text-gray-700">Total</th>
                            <th class="py-3 px-4 text-center font-semibold text-gray-700">Reserved</th>
                            <th class="py-3 px-4 text-center font-semibold text-gray-700">Dalam Proyek</th>
                            <th class="py-3 px-4 text-center font-semibold text-gray-700">Transfer</th>
                            <th class="py-3 px-4 text-center font-semibold text-gray-700">Available</th>
                            <th class="py-3 px-4 text-center font-semibold text-gray-700">Avg Usage</th>
                            <th class="py-3 px-4 text-center font-semibold text-gray-700">Estimasi Hari Habis</th>
                            <th class="py-3 px-4 text-center font-semibold text-gray-700">Lead Time (hari)</th>
                            <th class="py-3 px-4 text-center font-semibold text-gray-700">Reorder Status</th>
                            <th class="py-3 px-4 text-center font-semibold text-gray-700">Min Stok</th>
                            <th class="py-3 px-4 text-center font-semibold text-gray-700">Status</th>
                            <th class="py-3 px-4 text-center font-semibold text-gray-700">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template x-for="p in filteredProducts()" :key="p.name">
                            <tr class="border-b hover:bg-gray-50" :class="available(p) < (p.min_stok || 5) ? 'bg-red-50' : ''">
                                <td class="py-3 px-4 font-medium text-gray-900" x-text="p.name"></td>
                                <td class="py-3 px-4 text-right text-gray-700" x-text="'Rp ' + new Intl.NumberFormat('id-ID').format(p.price || 0)"></td>
                                <td class="py-3 px-4 text-center text-gray-700" x-text="p.total || 0"></td>
                                <td class="py-3 px-4 text-center text-gray-700" x-text="p.reserved || 0"></td>
                                <td class="py-3 px-4 text-center text-gray-700" x-text="p.in_project || 0"></td>
                                <td class="py-3 px-4 text-center text-gray-700" x-text="p.transfer || 0"></td>
                                <td class="py-3 px-4 text-center font-semibold text-gray-900" x-text="available(p)"></td>
                                <td class="py-3 px-4 text-center text-gray-700" x-text="p.avg_daily_usage || 1"></td>
                                <td class="py-3 px-4 text-center text-gray-700" x-text="daysLeft(p)"></td>
                                <td class="py-3 px-4 text-center text-gray-700" x-text="p.lead_time_days || 7"></td>
                                <td class="py-3 px-4 text-center">
                                    <span
                                        :class="{
                                            'bg-red-100 text-red-700': reorderStatus(p) === 'Order Sekarang',
                                            'bg-yellow-100 text-yellow-700': reorderStatus(p) === 'Order Segera',
                                            'bg-green-100 text-green-700': reorderStatus(p) === 'Aman'
                                        }"
                                        class="inline-block px-2 py-1 text-xs font-medium rounded-full"
                                        x-text="reorderStatus(p)">
                                    </span>
                                </td>
                                <td class="py-3 px-4 text-center text-gray-700" x-text="p.min_stok || 5"></td>
                                <td class="py-3 px-4 text-center">
                                    <span
                                        :class="{
                                            'bg-red-100 text-red-800': status(p) === 'Habis',
                                            'bg-yellow-100 text-yellow-800': status(p) === 'Menipis',
                                            'bg-green-100 text-green-800': status(p) === 'Aman'
                                        }"
                                        class="inline-block px-2 py-1 text-xs font-medium rounded-full"
                                        x-text="status(p)">
                                    </span>
                                </td>
                                <td class="py-3 px-4 text-center space-x-2">
                                    <button class="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                                        Detail
                                    </button>
                                    <button class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                                        Riwayat
                                    </button>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>
            <div class="px-4 py-3 bg-gray-50 text-sm text-gray-600">
                Menampilkan <span x-text="filteredProducts().length"></span> dari <span x-text="products.length"></span> produk
            </div>
        </div>

        <!-- Reorder Report Modal -->
        <div x-show="openReportModal" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow p-6 w-full max-w-md">
                <div class="font-semibold text-lg">Laporan Barang Perlu Reorder</div>
                <div class="mt-3 space-y-2 text-sm">
                    <template x-for="p in products.filter(p => reorderStatus(p) !== 'Aman')" :key="p.name">
                        <div class="border-b pb-2">
                            <div><strong><span x-text="p.name"></span></strong></div>
                            <div>Available: <span x-text="available(p)"></span></div>
                            <div>Estimasi hari habis: <span x-text="daysLeft(p)"></span></div>
                            <div>Lead time: <span x-text="p.lead_time_days || 7"></span> hari</div>
                            <div>Status: <span x-text="reorderStatus(p)"></span></div>
                        </div>
                    </template>
                </div>

                <div class="mt-6 flex justify-end space-x-2">
                    <button @click="openReportModal=false" class="px-4 py-2 bg-gray-200 rounded">Batal</button>
                    <form method="POST" action="/gudang/reorder/report" class="inline">
                        @csrf
                        <button type="submit" class="px-4 py-2 bg-red-600 text-white rounded">Kirim Laporan</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script>
        function stockDashboard() {
            return {
                search: '',
                filterStatus: 'all',
                products: @json($products ?? []),
                openReportModal: false,

                available(p) {
                    return (p.total || 0) -
                        (p.reserved || 0) -
                        (p.in_project || 0) -
                        (p.transfer || 0);
                },

                daysLeft(p) {
                    const avail = this.available(p);
                    const avg = p.avg_daily_usage || 1;
                    if (avg <= 0) return 0;
                    return Math.floor(avail / avg);
                },

                reorderStatus(p) {
                    const days = this.daysLeft(p);
                    const lead = p.lead_time_days || 7;
                    if (days <= 0) return 'Order Sekarang';
                    if (days <= lead) return 'Order Segera';
                    return 'Aman';
                },

                status(p) {
                    const avail = this.available(p);
                    if (avail <= 0) return 'Habis';
                    if (avail < (p.min_stok || 5)) return 'Menipis';
                    return 'Aman';
                },

                filteredProducts() {
                    return this.products.filter(p => {
                        const matchSearch = p.name.toLowerCase().includes(this.search.toLowerCase());
                        const st = this.status(p);

                        if (this.filterStatus === 'all') return matchSearch;
                        if (this.filterStatus === 'aman') return matchSearch && st === 'Aman';
                        if (this.filterStatus === 'menipis') return matchSearch && st === 'Menipis';
                        if (this.filterStatus === 'habis') return matchSearch && st === 'Habis';

                        return matchSearch;
                    });
                }
            }
        }
    </script>
</x-app-layout>