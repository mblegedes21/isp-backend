<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Material;
use App\Models\Product;
use App\Models\StockTransaction;
use App\Models\StockTransfer;
use App\Models\User;
use App\Services\ApiActorResolver;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockTransferController extends Controller
{
    public function index(Request $request)
    {
        $query = StockTransfer::query()->with(['material:id,name,sku', 'sourceBranch:id,name,code', 'destinationBranch:id,name,code'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return response()->json($query->paginate((int) $request->integer('per_page', 20)));
    }

    public function store(Request $request, ApiActorResolver $actorResolver, AuditLogger $auditLogger)
    {
        $actor = $actorResolver->resolve($request);
        $actorResolver->ensureRole($actor, [User::ROLE_ADMIN_GUDANG, User::ROLE_MANAGER]);

        $data = $request->validate([
            'item_id' => ['required', 'exists:materials,id'],
            'from_branch' => ['required', 'string', 'max:120'],
            'to_branch' => ['required', 'string', 'max:120'],
            'quantity' => ['required', 'integer', 'min:1'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $sourceBranch = Branch::query()->where('name', $data['from_branch'])->orWhere('code', $data['from_branch'])->first();
        $destinationBranch = Branch::query()->where('name', $data['to_branch'])->orWhere('code', $data['to_branch'])->first();

        $transfer = StockTransfer::create([
            'material_id' => $data['item_id'],
            'source_branch_id' => $sourceBranch?->id,
            'destination_branch_id' => $destinationBranch?->id,
            'from_branch' => $data['from_branch'],
            'to_branch' => $data['to_branch'],
            'quantity' => $data['quantity'],
            'unit_price' => $data['unit_price'],
            'total_price' => $data['unit_price'] * $data['quantity'],
            'notes' => $data['notes'] ?? null,
            'status' => 'PENDING',
            'requested_by' => $actor->id,
        ]);

        $auditLogger->write(
            action: 'stock.transfer.requested',
            module: 'stock',
            entityType: StockTransfer::class,
            entityId: $transfer->id,
            afterState: $transfer->toArray(),
            userId: $actor->id,
            request: $request,
        );

        return response()->json(['ok' => true, 'data' => $transfer->load(['material', 'sourceBranch', 'destinationBranch'])], 201);
    }

    public function approve(Request $request, StockTransfer $stockTransfer, ApiActorResolver $actorResolver, AuditLogger $auditLogger)
    {
        $actor = $actorResolver->resolve($request);
        $actorResolver->ensureRole($actor, [User::ROLE_ADMIN_GUDANG, User::ROLE_MANAGER]);

        $before = $stockTransfer->toArray();
        DB::transaction(function () use ($stockTransfer, $actor) {
            $sourceMaterial = Material::query()->lockForUpdate()->findOrFail($stockTransfer->material_id);
            abort_if((int) $sourceMaterial->stock < (int) $stockTransfer->quantity, 422, 'Stok material sumber tidak mencukupi untuk transfer.');

            $sourceMaterial->update([
                'stock' => (int) $sourceMaterial->stock - (int) $stockTransfer->quantity,
            ]);
            Product::query()->whereKey($sourceMaterial->id)->update([
                'stok' => $sourceMaterial->stock,
            ]);

            $destinationMaterial = Material::query()->firstOrCreate(
                [
                    'branch_id' => $stockTransfer->destination_branch_id,
                    'sku' => $sourceMaterial->sku,
                ],
                [
                    'category_id' => $sourceMaterial->category_id,
                    'brand_id' => $sourceMaterial->brand_id,
                    'name' => $sourceMaterial->name,
                    'stock' => 0,
                    'minimum_stock' => $sourceMaterial->minimum_stock,
                    'unit' => $sourceMaterial->unit,
                    'is_active' => true,
                    'description' => $sourceMaterial->description,
                ]
            );

            $destinationMaterial->update([
                'stock' => (int) $destinationMaterial->stock + (int) $stockTransfer->quantity,
            ]);
            DB::table('products')->updateOrInsert(
                ['id' => $destinationMaterial->id],
                [
                    'branch_id' => $destinationMaterial->branch_id,
                    'name' => $destinationMaterial->name,
                    'sku' => $destinationMaterial->sku,
                    'category' => $destinationMaterial->fresh('category')->category?->name,
                    'stok' => $destinationMaterial->stock,
                    'min_stock' => $destinationMaterial->minimum_stock,
                    'unit_type' => $destinationMaterial->unit,
                    'is_active' => $destinationMaterial->is_active,
                    'description' => $destinationMaterial->description,
                    'price' => $sourceMaterial->purchase_price ?? 0,
                    'lead_time_days' => 7,
                    'is_serialized' => false,
                    'avg_daily_usage' => 1,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );

            $stockTransfer->update([
                'status' => 'APPROVED',
                'approved_by' => $actor->id,
                'approved_at' => now(),
            ]);

            StockTransaction::query()->create([
                'material_id' => $sourceMaterial->id,
                'branch_id' => $stockTransfer->source_branch_id,
                'user_id' => $actor->id,
                'created_by' => $actor->id,
                'transaction_type' => 'TRANSFER',
                'type' => 'TRANSFER',
                'quantity' => $stockTransfer->quantity,
                'unit_price' => $stockTransfer->unit_price,
                'total_price' => $stockTransfer->total_price,
                'reference_type' => StockTransfer::class,
                'reference_id' => (string) $stockTransfer->id,
                'notes' => $stockTransfer->notes,
            ]);

            StockTransaction::query()->create([
                'material_id' => $destinationMaterial->id,
                'branch_id' => $stockTransfer->destination_branch_id,
                'user_id' => $actor->id,
                'created_by' => $actor->id,
                'transaction_type' => 'TRANSFER',
                'type' => 'TRANSFER',
                'quantity' => $stockTransfer->quantity,
                'unit_price' => $stockTransfer->unit_price,
                'total_price' => $stockTransfer->total_price,
                'reference_type' => StockTransfer::class,
                'reference_id' => (string) $stockTransfer->id,
                'notes' => $stockTransfer->notes,
            ]);
        });

        $auditLogger->write(
            action: 'stock.transfer.approved',
            module: 'stock',
            entityType: StockTransfer::class,
            entityId: $stockTransfer->id,
            beforeState: $before,
            afterState: $stockTransfer->fresh()->toArray(),
            userId: $actor->id,
            request: $request,
        );

        return response()->json(['ok' => true, 'data' => $stockTransfer->fresh()->load(['material', 'sourceBranch', 'destinationBranch'])]);
    }
}
