<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\Product;
use App\Models\StockReceipt;
use App\Models\StockTransaction;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockReceiptController extends Controller
{
    public function index(Request $request)
    {
        $query = StockReceipt::query()->with(['material:id,name,sku', 'branch:id,name', 'receiver:id,name'])->latest();

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        return response()->json($query->paginate((int) $request->integer('per_page', 20)));
    }

    public function store(Request $request, AuditLogger $auditLogger)
    {
        $data = $request->validate([
            'material_id' => ['required', 'exists:materials,id'],
            'branch_id' => ['required_without:branch', 'exists:branches,id'],
            'branch' => ['required_without:branch_id', 'string', 'max:120'],
            'quantity' => ['required', 'integer', 'min:1'],
            'unit_price' => ['required_without:price', 'numeric', 'min:0'],
            'price' => ['required_without:unit_price', 'numeric', 'min:0'],
            'source' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
        ]);
        $data['unit_price'] = $data['unit_price'] ?? $data['price'];
        $data['notes'] = $data['notes'] ?? $data['description'] ?? null;
        if (!isset($data['branch_id']) && isset($data['branch'])) {
            $data['branch_id'] = DB::table('branches')->where('name', $data['branch'])->orWhere('code', $data['branch'])->value('id');
        }

        $result = DB::transaction(function () use ($data, $request, $auditLogger) {
            $material = Material::query()->lockForUpdate()->findOrFail($data['material_id']);
            $before = $material->toArray();

            $material->update([
                'branch_id' => $data['branch_id'],
                'stock' => (int) $material->stock + (int) $data['quantity'],
            ]);
            Product::query()->whereKey($material->id)->update([
                'branch_id' => $material->branch_id,
                'stok' => $material->stock,
            ]);

            $receipt = StockReceipt::query()->create([
                ...$data,
                'received_by' => $request->user()?->id,
            ]);

            $transaction = StockTransaction::query()->create([
                'material_id' => $material->id,
                'branch_id' => $data['branch_id'],
                'user_id' => $request->user()?->id,
                'created_by' => $request->user()?->id,
                'transaction_type' => 'IN',
                'type' => 'IN',
                'quantity' => $data['quantity'],
                'unit_price' => $data['unit_price'],
                'total_price' => $data['unit_price'] * $data['quantity'],
                'reference_type' => StockReceipt::class,
                'reference_id' => (string) $receipt->id,
                'notes' => $data['notes'] ?? $data['source'] ?? null,
            ]);

            $auditLogger->write(
                action: 'stock.receipt.created',
                module: 'warehouse',
                entityType: StockReceipt::class,
                entityId: $receipt->id,
                beforeState: $before,
                afterState: ['receipt' => $receipt->toArray(), 'transaction' => $transaction->toArray(), 'material' => $material->fresh()->toArray()],
                userId: $request->user()?->id,
                branchId: $data['branch_id'],
                request: $request,
            );

            return [
                'receipt' => $receipt,
                'transaction' => $transaction,
            ];
        });

        $receipt = $result['receipt']->load(['material', 'branch', 'receiver']);

        return response()->json([
            'success' => true,
            'message' => 'Stock in recorded',
            'data' => [
                'receipt' => $receipt,
                'transaction' => $result['transaction'],
            ],
        ], 201);
    }
}
