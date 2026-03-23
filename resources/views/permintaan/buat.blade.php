<x-app-layout>
    <x-slot name="header">Buat Permintaan Material (Legacy)</x-slot>

    <div class="space-y-4">
        <div class="bg-white rounded-lg shadow p-4">
            <form x-data="permintaanForm()" @submit.prevent>
                <div class="mb-3">
                    <label class="text-sm font-medium">Jenis Pekerjaan</label>
                    <select x-model="type" class="mt-1 w-full border rounded px-3 py-2">
                        <option>Tarik Kabel</option>
                        <option>Pemasangan Baru</option>
                        <option>Maintenance</option>
                    </select>
                </div>

                <div class="mb-3">
                    <label class="text-sm font-medium">Nomor Tiket / Proyek</label>
                    <input x-model="ticket" class="mt-1 w-full border rounded px-3 py-2" placeholder="TCK-2026-..." />
                </div>

                <div>
                    <label class="text-sm font-medium">Daftar Material</label>
                    <template x-for="(it, idx) in items" :key="idx">
                        <div class="mt-2 p-2 border rounded flex items-center space-x-2">
                            <input x-model="it.name" class="flex-1 border rounded px-2 py-1 text-sm" />
                            <input x-model.number="it.qty" type="number" min="1" class="w-20 border rounded px-2 py-1 text-sm" />
                            <button @click.prevent="remove(idx)" class="text-red-600 text-sm">Hapus</button>
                        </div>
                    </template>

                    <div class="mt-3 flex space-x-2">
                        <input x-model="newName" placeholder="Nama material" class="flex-1 border rounded px-2 py-1 text-sm" />
                        <input x-model.number="newQty" type="number" min="1" placeholder="Qty" class="w-20 border rounded px-2 py-1 text-sm" />
                        <button @click.prevent="add()" class="px-3 py-1 bg-indigo-600 text-white rounded">Tambah</button>
                    </div>
                </div>

                <div class="mt-4 flex justify-end">
                    <button class="px-4 py-2 bg-gray-200 rounded">Batal</button>
                    <button @click.prevent class="ml-2 px-4 py-2 bg-green-600 text-white rounded">Kirim ke Leader</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        function permintaanForm() {
            return {
                type: 'Instalasi',
                ticket: '',
                items: @json($items ?? []),
                newName: '',
                newQty: 1,
                add() {
                    if (!this.newName) return;
                    this.items.push({
                        name: this.newName,
                        qty: this.newQty
                    });
                    this.newName = '';
                    this.newQty = 1;
                },
                remove(i) {
                    this.items.splice(i, 1);
                }
            }
        }
    </script>
</x-app-layout>