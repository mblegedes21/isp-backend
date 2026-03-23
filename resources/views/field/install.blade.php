<x-app-layout>
    <x-slot name="header">Scan Instalasi ONU</x-slot>

    <div class="mb-4">
        <h1 class="text-2xl font-semibold">Scan Instalasi ONU</h1>
    </div>

    <div class="bg-white shadow rounded-lg p-6 max-w-2xl">
        <form x-data="installForm()" @submit.prevent="confirm()">
            <div class="grid grid-cols-1 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">No Tiket</label>
                    <input x-model="ticket" class="mt-1 block w-full border rounded px-3 py-2" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Nama Pelanggan</label>
                    <input x-model="customer" class="mt-1 block w-full border rounded px-3 py-2" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Serial (Manual)</label>
                    <input x-model="serial" @keydown.enter.prevent="addSerial" placeholder="Masukkan serial lalu Enter" class="mt-1 block w-full border rounded px-3 py-2" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Pemindai Kamera</label>
                    <div class="mt-1 border rounded h-40 flex items-center justify-center text-gray-400">Kotak Kamera (placeholder)</div>
                </div>

                <div>
                    <h4 class="text-sm font-medium">Serial Terscan</h4>
                    <div class="mt-2 space-y-2">
                        <template x-for="(s, i) in scanned" :key="i">
                            <div class="flex items-center justify-between border rounded px-3 py-2">
                                <div x-text="s" class="font-mono"></div>
                                <div><button @click="remove(i)" class="text-sm text-red-600">Hapus</button></div>
                            </div>
                        </template>
                        <div x-show="scanned.length==0" class="text-sm text-gray-500">Belum ada serial.</div>
                    </div>
                </div>

                <div class="flex justify-end space-x-2">
                    <button type="button" class="px-4 py-2 bg-gray-200 rounded">Batal</button>
                    <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded">Konfirmasi</button>
                </div>
            </div>
        </form>

        <div x-show="status" class="mt-4">
            <div x-text="status" class="px-3 py-2 rounded text-white" :class="status==\'Aktivasi Berhasil\' ? 'bg-green-600' : 'bg-red-600'"></div>
        </div>
    </div>

    <script>
        function installForm() {
            return {
                ticket: '',
                customer: '',
                serial: '',
                scanned: @json($dummy['serials'] ?? []),
                status: '',
                addSerial() {
                    const s = this.serial.trim();
                    if (!s) return;
                    if (!this.scanned.includes(s)) this.scanned.push(s);
                    this.serial = '';
                },
                remove(i) {
                    this.scanned.splice(i, 1);
                },
                confirm() {
                    // dummy validation: success if any serial present
                    if (this.scanned.length > 0) {
                        this.status = 'Aktivasi Berhasil';
                    } else {
                        this.status = 'Gagal: tidak ada serial';
                    }
                }
            }
        }
    </script>
</x-app-layout>
