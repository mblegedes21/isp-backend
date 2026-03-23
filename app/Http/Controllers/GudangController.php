<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Services\StockService;
use App\Services\StockLedger;

class GudangController extends Controller
{
    public function dashboard()
    {
        $summary = [
            'total_item' => 1024,
            'total_nilai' => 125000000, // in IDR
            'keluar_today' => 48,
            'masuk_today' => 12,
            'transfer_pending' => 5,
            'outstanding_proyek' => 7,
        ];

        $by_location = [
            ['loc' => 'Gudang Pusat', 'value' => 70000000],
            ['loc' => 'Cabang A', 'value' => 30000000],
            ['loc' => 'Cabang B', 'value' => 25000000],
        ];

        return view('gudang.dashboard', compact('summary', 'by_location'));
    }

    public function requestProyek()
    {
        $requests = [
            [
                'id' => 'PRJ-1001',
                'teknisi' => 'Andi',
                'leader' => 'Leader A',
                'type' => 'Instalasi',
                'lokasi' => 'Cabang A',
                'status' => 'Menunggu Gudang',
                'products' => [['name' => 'ONU Model X', 'qty' => 3], ['name' => 'Splitter 1:8', 'qty' => 2], ['name' => 'Kabel Drop', 'qty' => '120m']]
            ],
            [
                'id' => 'PRJ-1002',
                'teknisi' => 'Budi',
                'leader' => 'Leader B',
                'type' => 'Maintenance',
                'lokasi' => 'Pusat',
                'status' => 'Menunggu Gudang',
                'products' => [['name' => 'ONU Model X', 'qty' => 1], ['name' => 'Kabel Drop', 'qty' => '50m']]
            ],
        ];

        return view('gudang.request-proyek', compact('requests'));
    }

    public function requestProyekShow($id)
    {
        // dummy project detail
        $project = [
            'id' => $id,
            'leader' => 'Leader A',
            'teknisi' => 'Andi',
            'type' => 'Instalasi',
            'lokasi' => 'Cabang A',
            'date' => '2026-02-24',
            'materials' => [
                ['name' => 'ONU Model X', 'qty_approved' => 3, 'stock' => 10, 'price' => 1500000],
                ['name' => 'Splitter 1:8', 'qty_approved' => 2, 'stock' => 1, 'price' => 500000],
                ['name' => 'Kabel Drop (m)', 'qty_approved' => 120, 'stock' => 200, 'price' => 5000],
            ]
        ];

        return view('gudang.request-proyek-show', compact('project'));
    }

    public function returnProyek()
    {
        // TODO: Replace stock calculations with StockMovement ledger entries
        // this method currently builds static project arrays; when projects are
        // pulled from the database the `available` amount should come from
        // StockService::getAvailable() instead of hard-coded values.
        $projects = [];

        $p1 = [
            'id' => 'PRJ-0999',
            'leader' => 'Leader B',
            'teknisi' => 'Rina',
            'lokasi' => session('active_location', 'Pusat'),
            'status' => 'Menunggu Verifikasi Return',
            'items' => [
                ['sku' => 'ONU-X', 'name' => 'ONU Model X', 'satuan' => 'pcs', 'qty_keluar' => 5, 'qty_kembali' => 3, 'harga' => 1500000, 'serialized' => true],
                ['sku' => 'SPL-1:8', 'name' => 'Splitter 1:8', 'satuan' => 'pcs', 'qty_keluar' => 3, 'qty_kembali' => 2, 'harga' => 500000, 'serialized' => false],
                ['sku' => 'KBL-DRP', 'name' => 'Kabel Drop', 'satuan' => 'm', 'qty_keluar' => 200, 'qty_kembali' => 120, 'harga' => 5000, 'serialized' => false],
            ]
        ];

        $p2 = [
            'id' => 'PRJ-0998',
            'leader' => 'Leader A',
            'teknisi' => 'Andi',
            'lokasi' => session('active_location', 'Cabang A'),
            'status' => 'Menunggu Verifikasi Return',
            'items' => [
                ['sku' => 'ONU-X', 'name' => 'ONU Model X', 'satuan' => 'pcs', 'qty_keluar' => 2, 'qty_kembali' => 1, 'harga' => 1500000, 'serialized' => true],
                ['sku' => 'ODP-8', 'name' => 'ODP 8 Port', 'satuan' => 'pcs', 'qty_keluar' => 1, 'qty_kembali' => 1, 'harga' => 200000, 'serialized' => false],
            ]
        ];

        foreach ([$p1, $p2] as $p) {
            $selisih_total = 0;
            $potensi = 0;
            foreach ($p['items'] as $it) {
                $s = 0;
                // handle numeric quantities
                $s = (float)$it['qty_keluar'] - (float)$it['qty_kembali'];
                $s = $s > 0 ? $s : 0;
                $selisih_total += $s;
                $potensi += $s * $it['harga'];
            }
            $p['selisih'] = $selisih_total;
            $p['nilai_rp'] = $potensi;
            $projects[] = $p;
        }

        return view('gudang.return-proyek', ['returns' => $projects]);
    }

    public function returnProyekShow($id)
    {
        // Build merged project data with items
        $project = [
            'id' => $id,
            'leader' => 'Leader B',
            'teknisi' => 'Rina',
            'type' => 'Instalasi',
            'lokasi' => session('active_location', 'Pusat'),
            'ticket' => 'TCK-' . substr(md5($id . time()), 0, 8),
            'date' => date('Y-m-d'),
            'items' => [
                ['sku' => 'ONU-X', 'name' => 'ONU Model X', 'satuan' => 'pcs', 'qty_keluar' => 5, 'qty_kembali' => 3, 'harga' => 1500000, 'serialized' => true, 'serials_return' => ['SN-A10001', 'SN-A10003', 'SN-A10004']],
                ['sku' => 'SPL-1:8', 'name' => 'Splitter 1:8', 'satuan' => 'pcs', 'qty_keluar' => 3, 'qty_kembali' => 2, 'harga' => 500000, 'serialized' => false],
                ['sku' => 'KBL-DRP', 'name' => 'Kabel Drop', 'satuan' => 'm', 'qty_keluar' => 200, 'qty_kembali' => 120, 'harga' => 5000, 'serialized' => false],
            ]
        ];

        // compute totals
        $selisih_total = 0;
        $potensi = 0;
        foreach ($project['items'] as $it) {
            $s = (float)$it['qty_keluar'] - (float)$it['qty_kembali'];
            $s = $s > 0 ? $s : 0;
            $selisih_total += $s;
            $potensi += $s * $it['harga'];
        }
        $project['selisih_total'] = $selisih_total;
        $project['potensi_rp'] = $potensi;

        return view('gudang.return-proyek-show', compact('project'));
    }

    public function returnProyekPrint($id)
    {
        // generate same project structure for printing
        $project = [
            'id' => $id,
            'leader' => 'Leader B',
            'teknisi' => 'Rina',
            'lokasi' => session('active_location', 'Pusat'),
            'ticket' => 'TCK-' . substr(md5($id . time()), 0, 8),
            'date' => date('Y-m-d'),
            'items' => [
                ['name' => 'ONU Model X', 'satuan' => 'pcs', 'qty_keluar' => 5, 'qty_kembali' => 3],
                ['name' => 'Splitter 1:8', 'satuan' => 'pcs', 'qty_keluar' => 3, 'qty_kembali' => 2],
                ['name' => 'Kabel Drop', 'satuan' => 'm', 'qty_keluar' => 200, 'qty_kembali' => 120],
            ]
        ];

        return view('gudang.return-proyek-print', compact('project'));
    }

    public function confirmReturn(\Illuminate\Http\Request $request, $id)
    {
        // example ledger recording; in a real implementation the request would
        // include item ids and qtys that were returned. we illustrate the
        // pattern here and keep the old flash behavior so existing UI still works.
        try {
            $ledger = new StockLedger();
            $locationId = config('warehouse.default_location_id');
            // hypothetical loop over returned items (not part of dummy data)
            // foreach ($request->input('items', []) as $item) {
            //     $ledger->record($item['product_id'], $locationId, 'PROJECT_RETURN', $item['qty'], 'GudangController@confirmReturn', $id);
            // }
        } catch (\Exception $e) {
            // record failures should not break the UI in demo mode
        }

        session()->flash('status', 'Return berhasil diverifikasi (simulasi).');
        return redirect()->route('gudang.dashboard');
    }

    public function reportSelisih(\Illuminate\Http\Request $request, $id)
    {
        // collect form data (simulate), create dummy case id
        $caseId = 'KS-' . strtoupper(substr(md5($id . time()), 0, 6));
        // store minimal info in session to show in owner list
        $cases = session('sim_cases', []);
        $cases[] = [
            'case_id' => $caseId,
            'project_id' => $id,
            'lokasi' => session('active_location', 'Pusat'),
            'leader' => 'Leader B',
            'teknisi' => 'Rina',
            'selisih_qty' => 2,
            'selisih_rp' => 2500000,
            'status' => 'Menunggu Review'
        ];
        session(['sim_cases' => $cases]);
        session()->flash('status', 'Kasus selisih dibuat (simulasi).');
        return redirect()->route('manager.dashboard');
    }

    public function stok()
    {
        $summary = ['total_produk' => 0, 'total_unit' => 0, 'total_nilai' => 0];

        // use the ledger service to compute availability rather than hard-coding
        $stockService = new StockService();
        $locationId = config('warehouse.default_location_id');

        $products = Product::all()->map(function (Product $p) use ($stockService, $locationId) {
            $available = $stockService->getAvailable($p->id, $locationId);
            return [
                'name' => $p->name,
                'available' => $available,
                'in_project' => 0,   // not tracked in demo
                'reserved' => 0,     // not tracked in demo
                'price' => $p->price,
                'min_stok' => $p->min_stock,
            ];
        })->toArray();

        // compute summary values from the derived list so the view still has
        // something to show even if the database is empty
        $summary['total_produk'] = count($products);
        $summary['total_unit'] = array_sum(array_column($products, 'available'));
        $summary['total_nilai'] = array_sum(array_map(fn($p) => $p['available'] * $p['price'], $products));

        return view('gudang.stok', compact('summary', 'products'));
    }
}
