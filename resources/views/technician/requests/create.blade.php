<x-app-layout>
    <x-slot name="header">Buat Permintaan Barang</x-slot>

    <div class="space-y-4">
        <div class="bg-white rounded-lg shadow p-4">
            <form method="POST" action="{{ route('technician.permintaan.store') }}" x-data="requestForm()">
                @csrf

                <div>
                    <label class="text-sm font-medium">Daftar Material</label>
                    <template x-for="(it, idx) in materials" :key="idx">
                        <div class="mt-2 p-2 border rounded flex items-center space-x-2">
                            <select :name="`materials[${idx}][product_id]`" x-model="it.product_id" class="flex-1 border rounded px-2 py-1 text-sm" required>
                                <option value="">-- pilih produk --</option>
                                @foreach([] as $p)
                                <option value="{{ $p->id }}">{{ $p->sku }} - {{ $p->name }}</option>
                                @endforeach
                            </select>
                            <input x-model.number="it.qty" :name="`materials[${idx}][qty]`" type="number" min="1" placeholder="Qty" class="w-20 border rounded px-2 py-1 text-sm" required />
                            <button @click.prevent="remove(idx)" class="text-red-600 text-sm">Hapus</button>
                        </div>
                    </template>

                    <div class="mt-3 flex space-x-2">
                        <button @click.prevent="addRow()" class="px-3 py-1 bg-indigo-600 text-white rounded">Tambah Baris</button>
                    </div>
                </div>

                <div class="mt-4 flex justify-end">
                    <button class="px-4 py-2 bg-gray-200 rounded">Batal</button>
                    <button type="submit" class="ml-2 px-4 py-2 bg-green-600 text-white rounded">Kirim</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        function requestForm() {
            return {
                materials: [],
                addRow() {
                    this.materials.push({
                        product_id: null,
                        qty: 1
                    });
                },
                remove(i) {
                    this.materials.splice(i, 1);
                }
            }
        }
    </script>
</x-app-layout>


