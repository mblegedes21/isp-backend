<div x-data="scanOnu()" class="bg-white p-4 rounded shadow">
    <label class="block text-sm font-medium text-gray-700">Pindai Serial (Barcode)</label>
    <div class="mt-2 flex items-center space-x-2">
        <input x-ref="input" x-model="current" @keydown.enter.prevent="addSerial()" type="text" placeholder="Arahkan barcode atau ketik serial lalu Enter" class="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" autofocus />
        <button @click="addSerial()" class="px-3 py-2 bg-blue-600 text-white rounded">Tambah</button>
    </div>

    <div class="mt-3">
        <h4 class="text-sm font-medium">Terpasang</h4>
        <div class="mt-2 space-y-2">
            <template x-for="(s, idx) in serials" :key="s">
                <div class="flex items-center justify-between border rounded px-3 py-2">
                    <div class="flex items-center space-x-3">
                        <span x-text="s" class="font-mono"></span>
                        <span x-show="valids.includes(s)" class="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Valid</span>
                        <span x-show="errors.includes(s)" class="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Error</span>
                    </div>
                    <div>
                        <button @click="remove(idx)" class="text-sm text-red-600">Hapus</button>
                    </div>
                </div>
            </template>
            <div x-show="serials.length==0" class="text-sm text-gray-500">Belum ada serial.</div>
        </div>
    </div>

    <script>
        function scanOnu() {
            return {
                current: '',
                serials: ['SN-A10001', 'SN-A10002'],
                valids: ['SN-A10001', 'SN-A10002'],
                errors: [],
                addSerial() {
                    const s = this.current.trim();
                    if (!s) return this.clear();
                    if (this.serials.includes(s)) {
                        if (!this.errors.includes(s)) this.errors.push(s);
                        this.current = '';
                        this.$refs.input.focus();
                        return;
                    }
                    // Simulate validation: ONU serials prefixed SN-
                    if (!s.startsWith('SN-')) {
                        this.errors.push(s);
                    } else {
                        this.serials.push(s);
                        this.valids.push(s);
                    }
                    this.current = '';
                    this.$refs.input.focus();
                },
                remove(i) {
                    const s = this.serials[i];
                    this.serials.splice(i, 1);
                    const vi = this.valids.indexOf(s);
                    if (vi > -1) this.valids.splice(vi, 1);
                    const ei = this.errors.indexOf(s);
                    if (ei > -1) this.errors.splice(ei, 1);
                },
                clear() {
                    this.current = '';
                    this.$refs.input.focus();
                }
            }
        }
    </script>
</div>