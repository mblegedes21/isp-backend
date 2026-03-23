<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LossReport;
use App\Models\Material;
use App\Models\PurchaseRequest;
use App\Models\StockAudit;
use App\Models\StockTransaction;
use App\Models\StockTransfer;
use Illuminate\Http\Request;

class WarehouseDashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $branchId = $request->user()?->branch_id;

        return response()->json([
            'success' => true,
            'data' => [
                'total_materials' => Material::query()
                    ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                    ->count(),
                'low_stock_count' => Material::query()
                    ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                    ->whereColumn('stock', '<=', 'minimum_stock')
                    ->count(),
                'total_loss_value' => (float) LossReport::query()
                    ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                    ->where('status', 'DISETUJUI')
                    ->sum('total_price'),
                'audit_difference_count' => StockAudit::query()
                    ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                    ->where('difference', '!=', 0)
                    ->count(),
                'purchase_requests_pending' => PurchaseRequest::query()
                    ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                    ->where('status', 'pending')
                    ->count(),
                'low_stock_materials' => Material::query()
                    ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                    ->whereColumn('stock', '<=', 'minimum_stock')
                    ->limit(10)
                    ->get(['id', 'name', 'brand', 'sku', 'stock', 'minimum_stock', 'purchase_price']),
                'recent_transactions' => StockTransaction::query()
                    ->with('material:id,name,brand,sku')
                    ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                    ->latest()
                    ->limit(10)
                    ->get(),
                'recent_audits' => StockAudit::query()
                    ->with('material:id,name,brand')
                    ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                    ->latest()
                    ->limit(10)
                    ->get(),
                'purchase_requests' => PurchaseRequest::query()
                    ->with(['material:id,name,brand', 'requester:id,name'])
                    ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                    ->latest()
                    ->limit(10)
                    ->get(),
                'pending_transfers' => StockTransfer::query()
                    ->when($branchId, fn ($query) => $query->where('source_branch_id', $branchId)->orWhere('destination_branch_id', $branchId))
                    ->where('status', 'PENDING')
                    ->count(),
                'pending_loss_reports' => LossReport::query()
                    ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                    ->where('status', 'MENUNGGU')
                    ->count(),
            ],
        ]);
    }
}
