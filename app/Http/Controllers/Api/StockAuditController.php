<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LossReport;
use App\Models\Material;
use App\Models\Product;
use App\Models\StockAudit;
use App\Models\StockTransaction;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockAuditController extends Controller
{
    public function index(Request $request)
    {
        $query = StockAudit::query()
            ->with(['material:id,name,brand,branch_id', 'branch:id,name', 'creator:id,name'])
            ->latest();

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return response()->json([
            'success' => true,
            'message' => 'Stock audits fetched',
            'data' => $query->paginate((int) $request->integer('per_page', 20)),
        ]);
    }

    public function store(Request $request, AuditLogger $auditLogger)
    {
        $data = $request->validate([
            'material_id' => ['required', 'exists:materials,id'],
            'branch_id' => ['required', 'exists:branches,id'],
            'physical_stock' => ['required_without:actual_stock', 'integer', 'min:0'],
            'actual_stock' => ['required_without:physical_stock', 'integer', 'min:0'],
            'unit_price' => ['required_without:price', 'numeric', 'min:0'],
            'price' => ['required_without:unit_price', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'auditor_id' => ['nullable', 'exists:users,id'],
        ]);
        $data['physical_stock'] = $data['physical_stock'] ?? $data['actual_stock'];
        $data['unit_price'] = $data['unit_price'] ?? $data['price'];

        $material = Material::query()->findOrFail($data['material_id']);
        $systemStock = (int) $material->stock;
        $difference = (int) $data['physical_stock'] - $systemStock;

        $audit = StockAudit::query()->create([
            'material_id' => $material->id,
            'branch_id' => $data['branch_id'],
            'system_stock' => $systemStock,
            'physical_stock' => (int) $data['physical_stock'],
            'difference' => $difference,
            'unit_price' => (float) $data['unit_price'],
            'total_difference_value' => $difference * (float) $data['unit_price'],
            'notes' => $data['notes'] ?? null,
            'created_by' => $data['auditor_id'] ?? $request->user()?->id,
            'status' => 'pending',
        ]);

        $auditLogger->write(
            action: 'stock-audit.created',
            module: 'warehouse',
            entityType: StockAudit::class,
            entityId: $audit->id,
            afterState: $audit->toArray(),
            userId: $request->user()?->id,
            branchId: $audit->branch_id,
            request: $request,
        );

        return response()->json([
            'success' => true,
            'message' => 'Stock audit created',
            'data' => $this->serialize($audit->load(['material', 'branch', 'creator'])),
        ], 201);
    }

    public function approve(Request $request, StockAudit $stockAudit, AuditLogger $auditLogger)
    {
        $before = $stockAudit->toArray();

        DB::transaction(function () use ($stockAudit, $request) {
            $material = Material::query()->lockForUpdate()->findOrFail($stockAudit->material_id);
            $material->update(['stock' => $stockAudit->physical_stock]);

            Product::query()->whereKey($material->id)->update(['stok' => $stockAudit->physical_stock]);

            $stockAudit->update(['status' => 'approved']);

            StockTransaction::query()->create([
                'material_id' => $stockAudit->material_id,
                'branch_id' => $stockAudit->branch_id,
                'user_id' => $request->user()?->id,
                'created_by' => $request->user()?->id,
                'transaction_type' => 'AUDIT_ADJUSTMENT',
                'type' => 'AUDIT_ADJUSTMENT',
                'quantity' => abs((int) $stockAudit->difference),
                'unit_price' => $stockAudit->unit_price,
                'total_price' => abs((float) $stockAudit->total_difference_value),
                'reference_type' => StockAudit::class,
                'reference_id' => (string) $stockAudit->id,
                'notes' => $stockAudit->notes,
            ]);
        });

        $auditLogger->write(
            action: 'stock-audit.approved',
            module: 'warehouse',
            entityType: StockAudit::class,
            entityId: $stockAudit->id,
            beforeState: $before,
            afterState: $stockAudit->fresh()->toArray(),
            userId: $request->user()?->id,
            branchId: $stockAudit->branch_id,
            request: $request,
        );

        return response()->json([
            'success' => true,
            'message' => 'Stock audit approved',
            'data' => $this->serialize($stockAudit->fresh()->load(['material', 'branch', 'creator'])),
        ]);
    }

    public function reject(Request $request, StockAudit $stockAudit, AuditLogger $auditLogger)
    {
        $before = $stockAudit->toArray();
        $stockAudit->update([
            'status' => 'rejected',
            'notes' => trim(collect([$stockAudit->notes, $request->input('reason')])->filter()->implode("\n")),
        ]);

        $auditLogger->write(
            action: 'stock-audit.rejected',
            module: 'warehouse',
            entityType: StockAudit::class,
            entityId: $stockAudit->id,
            beforeState: $before,
            afterState: $stockAudit->fresh()->toArray(),
            userId: $request->user()?->id,
            branchId: $stockAudit->branch_id,
            request: $request,
        );

        return response()->json([
            'success' => true,
            'message' => 'Stock audit rejected',
            'data' => $this->serialize($stockAudit->fresh()->load(['material', 'branch', 'creator'])),
        ]);
    }

    public function createLossReport(Request $request, StockAudit $stockAudit, AuditLogger $auditLogger)
    {
        abort_if($stockAudit->difference >= 0, 422, 'Loss report hanya dapat dibuat untuk selisih negatif.');

        $existing = LossReport::query()
            ->where('material_id', $stockAudit->material_id)
            ->where('branch_id', $stockAudit->branch_id)
            ->where('reason', 'like', "%stock audit #{$stockAudit->id}%")
            ->first();

        if ($existing) {
            return response()->json([
                'success' => true,
                'message' => 'Loss report already exists',
                'data' => $existing,
            ]);
        }

        $loss = LossReport::query()->create([
            'ticket_id' => null,
            'branch_id' => $stockAudit->branch_id,
            'area_id' => null,
            'technician_id' => $request->user()?->id,
            'material_id' => $stockAudit->material_id,
            'quantity' => abs((int) $stockAudit->difference),
            'unit_price' => $stockAudit->unit_price,
            'total_price' => abs((int) $stockAudit->difference) * (float) $stockAudit->unit_price,
            'loss_percent' => $stockAudit->system_stock > 0 ? round((abs((int) $stockAudit->difference) / $stockAudit->system_stock) * 100, 2) : 0,
            'reason' => trim(collect([
                "Loss generated from stock audit #{$stockAudit->id}.",
                $stockAudit->notes,
            ])->filter()->implode(' ')),
            'status' => 'MENUNGGU',
        ]);

        $auditLogger->write(
            action: 'stock-audit.loss-created',
            module: 'warehouse',
            entityType: LossReport::class,
            entityId: $loss->id,
            afterState: $loss->toArray(),
            userId: $request->user()?->id,
            branchId: $stockAudit->branch_id,
            request: $request,
        );

        return response()->json([
            'success' => true,
            'message' => 'Loss report created from stock audit',
            'data' => $loss,
        ], 201);
    }

    private function serialize(StockAudit $stockAudit): array
    {
        return [
            'id' => $stockAudit->id,
            'material_id' => $stockAudit->material_id,
            'material_name' => trim(collect([$stockAudit->material?->brand, $stockAudit->material?->name])->filter()->implode(' ')),
            'branch_id' => $stockAudit->branch_id,
            'branch_name' => $stockAudit->branch?->name,
            'system_stock' => (int) $stockAudit->system_stock,
            'physical_stock' => (int) $stockAudit->physical_stock,
            'difference' => (int) $stockAudit->difference,
            'unit_price' => (float) $stockAudit->unit_price,
            'total_difference_value' => (float) $stockAudit->total_difference_value,
            'notes' => $stockAudit->notes,
            'created_by' => $stockAudit->created_by,
            'created_by_name' => $stockAudit->creator?->name,
            'status' => $stockAudit->status,
            'can_create_loss' => $stockAudit->difference < 0,
            'created_at' => $stockAudit->created_at,
        ];
    }
}
