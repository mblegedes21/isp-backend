<div x-data="serialInput()" class="w-full">
    <div class="flex items-center space-x-4">
        <label class="inline-flex items-center">
            <input type="radio" name="mode" value="scan" x-model="mode" class="form-radio" />
            <span class="ms-2 text-sm">Scan</span>
        </label>
        <label class="inline-flex items-center">
            <input type="radio" name="mode" value="paste" x-model="mode" class="form-radio" />
            <span class="ms-2 text-sm">Paste</span>
        </label>
    </div>

    <div class="mt-3">
        <template x-if="mode=='scan'">
            <div>
                <input x-ref="scanInput" x-on:keydown.enter.prevent="addScan()" placeholder="Scan or type serial and press Enter" class="w-full border rounded px-3 py-2" />
            </div>
        </template>

        <template x-if="mode=='paste'">
            <div>
                <textarea x-ref="pasteArea" rows="4" class="w-full border rounded px-3 py-2" placeholder="Paste serials, one per line"></textarea>
                <div class="mt-2">
                    <button type="button" @click="addFromPaste()" class="px-3 py-1 bg-blue-600 text-white rounded">Add</button>
                </div>
            </div>
        </template>
    </div>

    <div class="mt-4">
        <h4 class="text-sm font-medium">Selected serials</h4>
        <ul class="mt-2 space-y-2">
            <template x-for="(s, idx) in serials" :key="idx">
                <li class="flex items-center justify-between bg-gray-50 border rounded px-3 py-2">
                    <span x-text="s"></span>
                    <button type="button" @click="remove(idx)" class="text-red-600 text-sm">Remove</button>
                </li>
            </template>
            <template x-if="serials.length==0">
                <li class="text-sm text-gray-500">No serials added yet.</li>
            </template>
        </ul>
    </div>

    <script>
        function serialInput() {
            return {
                mode: 'scan',
                serials: [],
                addScan() {
                    const v = this.$refs.scanInput.value.trim();
                    if (!v) return;
                    this.serials.push(v);
                    this.$refs.scanInput.value = '';
                },
                addFromPaste() {
                    const raw = this.$refs.pasteArea.value.trim();
                    if (!raw) return;
                    const lines = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                    this.serials.push(...lines);
                    this.$refs.pasteArea.value = '';
                },
                remove(i) {
                    this.serials.splice(i, 1)
                }
            }
        }
    </script>
</div>