<x-app-layout>
    <x-slot name="header">Issue Barang</x-slot>

    <div class="mb-4 flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-semibold">Issue Barang</h1>
            <nav class="text-sm text-gray-500 mt-1">Home / Gudang / Issue</nav>
        </div>
        <div>
            <a href="{{ url('#') }}" class="px-3 py-2 bg-gray-100 rounded">Outstanding</a>
        </div>
    </div>

    <div class="bg-white shadow rounded-lg p-6">
        <form x-data="issueForm()">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Lokasi</label>
                    <select class="mt-1 block w-full border rounded px-3 py-2" name="location">
                        <option>Pusat</option>
                        <option>Cabang A</option>
                        <option>Cabang B</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Teknisi</label>
                    <select class="mt-1 block w-full border rounded px-3 py-2" name="technician">
                        <option>Teknisi A</option>
                        <option>Teknisi B</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Produk</label>
                    <select x-model="selected" class="mt-1 block w-full border rounded px-3 py-2">
                        @foreach([] as $p)
                        <option value="{{ $p['sku'] }}" data-serialized="{{ $p['sku']=='ONU-X' ? '1' : '0' }}">{{ $p['name'] }} ({{ $p['sku'] }})</option>
                        @endforeach
                    </select>
                </div>
            </div>

            <div class="mb-4" x-show="isSerialized()">
                <h4 class="text-sm font-medium mb-2">Pindai Serial (ONU)</h4>
                <x-scan-onu />
            </div>

            <div class="mb-4" x-show="!isSerialized()">
                <label class="block text-sm font-medium text-gray-700">Jumlah</label>
                <input type="number" min="1" value="1" class="mt-1 block w-40 border rounded px-3 py-2" />
            </div>

            <div class="flex justify-end space-x-2">
                <button type="button" class="px-4 py-2 bg-gray-200 rounded">Batal</button>
                <button type="button" class="px-4 py-2 bg-green-600 text-white rounded">Proses Issue</button>
            </div>
        </form>
    </div>

    <script>
        function issueForm() {
            return {
                selected: '',
                isSerialized() {
                    return this.selected.includes('ONU');
                }
            }
        }
    </script>
</x-app-layout>


