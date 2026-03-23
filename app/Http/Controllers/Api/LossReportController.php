<?php

namespace App\Http\Controllers\Api;

use App\Events\LossApproved;
use App\Events\LossReported;
use App\Http\Controllers\Controller;
use App\Models\LossReport;
use App\Models\Material;
use App\Models\Product;
use App\Models\StockTransaction;
use App\Models\Ticket;
use App\Models\User;
use App\Services\ApiActorResolver;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LossReportController extends Controller
{
    public function index(Request $request)
    {
        $query = LossReport::query()->with(['ticket:id,nomor_ticket', 'technician:id,name', 'material:id,name,sku', 'area:id,name', 'branch:id,name'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        return response()->json([
            'success' => true,
            'message' => 'Loss reports fetched',
            'data' => $query->paginate((int) $request->integer('per_page', 20)),
        ]);
    }

    public function store(Request $request, ApiActorResolver $actorResolver, AuditLogger $auditLogger)
    {
        $actor = $actorResolver->resolve($request);
        $actorResolver->ensureRole($actor, [User::ROLE_TEKNISI, User::ROLE_LEADER, User::ROLE_ADMIN_GUDANG, User::ROLE_MANAGER]);

        $data = $request->validate([
            'ticket_id' => ['nullable'],
            'technician_id' => ['nullable', 'exists:users,id'],
            'item_id' => ['nullable', 'exists:materials,id'],
            'material_id' => ['nullable', 'exists:materials,id'],
            'reported_by' => ['nullable', 'exists:users,id'],
            'quantity_lost' => ['nullable', 'numeric', 'min:0.1'],
            'quantity' => ['nullable', 'numeric', 'min:0.1'],
            'loss_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'note' => ['nullable', 'string'],
            'reason' => ['nullable', 'string'],
        ]);
        $ticket = !empty($data['ticket_id'])
            ? Ticket::query()->where('nomor_ticket', $data['ticket_id'])->orWhere('id', $data['ticket_id'])->first()
            : null;
        $materialId = $data['material_id'] ?? $data['item_id'] ?? null;
        $quantity = $data['quantity'] ?? $data['quantity_lost'] ?? null;
        $reason = $data['reason'] ?? $data['note'] ?? null;
        abort_if(!$materialId, 422, 'Material wajib dipilih.');
        abort_if(!$quantity, 422, 'Jumlah loss wajib diisi.');
        abort_if(blank($reason), 422, 'Alasan loss wajib diisi.');

        $material = Material::query()->findOrFail($materialId);
        $loss = DB::transaction(function () use ($data, $ticket, $material, $quantity, $reason, $actor) {
            $quantityValue = (int) ceil((float) $quantity);
            $isImmediateWarehouseLoss = blank($data['ticket_id']) || filled($data['reported_by']);

            if ($isImmediateWarehouseLoss) {
                abort_if((int) $material->stock < $quantityValue, 422, 'Stok material tidak mencukupi.');
                $material->update(['stock' => (int) $material->stock - $quantityValue]);
                Product::query()->whereKey($material->id)->update(['stok' => $material->stock]);
            }

            $loss = LossReport::create([
                'ticket_id' => $ticket?->id,
                'branch_id' => $ticket?->branch_id ?? $material->branch_id,
                'area_id' => $ticket?->area_id,
                'technician_id' => $data['technician_id'] ?? $data['reported_by'] ?? $ticket?->technician_id ?? $actor->id,
                'material_id' => $material->id,
                'quantity' => $quantityValue,
                'unit_price' => (float) $material->purchase_price,
                'total_price' => $quantityValue * (float) $material->purchase_price,
                'loss_percent' => $data['loss_percent'] ?? 0,
                'reason' => $reason,
                'status' => $isImmediateWarehouseLoss ? 'DISETUJUI' : 'MENUNGGU',
            ]);

            if ($isImmediateWarehouseLoss) {
                StockTransaction::create([
                    'material_id' => $material->id,
                    'branch_id' => $material->branch_id,
                    'user_id' => $actor->id,
                    'created_by' => $actor->id,
                    'transaction_type' => 'LOSS',
                    'type' => 'LOSS',
                    'quantity' => $quantityValue,
                    'unit_price' => (float) $material->purchase_price,
                    'total_price' => $quantityValue * (float) $material->purchase_price,
                    'reference_type' => LossReport::class,
                    'reference_id' => (string) $loss->id,
                    'notes' => $reason,
                ]);
            }

            return $loss;
        });

        $auditLogger->write(
            action: 'loss.reported',
            module: 'stock',
            entityType: LossReport::class,
            entityId: $loss->id,
            afterState: $loss->toArray(),
            userId: $actor->id,
            branchId: $loss->branch_id,
            areaId: $loss->area_id,
            request: $request,
        );

        LossReported::dispatch($loss);

        return response()->json(['success' => true, 'message' => 'Loss report created', 'data' => $loss], 201);
    }

    public function decide(Request $request, LossReport $lossReport, ApiActorResolver $actorResolver, AuditLogger $auditLogger)
    {
        $actor = $actorResolver->resolve($request);
        $actorResolver->ensureRole($actor, [User::ROLE_MANAGER, User::ROLE_ADMIN_GUDANG]);

        $data = $request->validate([
            'decision' => ['required', 'in:APPROVE,REJECT,INVESTIGATE'],
            'reason' => ['nullable', 'string'],
        ]);

        $before = $lossReport->toArray();

        if ($data['decision'] === 'APPROVE') {
            DB::transaction(function () use ($lossReport, $actor) {
                $material = Material::query()->lockForUpdate()->findOrFail($lossReport->material_id);
                abort_if((int) $material->stock < (int) $lossReport->quantity, 422, 'Stok material tidak mencukupi untuk approval loss.');

                $material->update([
                    'stock' => (int) $material->stock - (int) $lossReport->quantity,
                ]);
                Product::query()->whereKey($material->id)->update(['stok' => $material->stock]);

                $lossReport->update(['status' => 'DISETUJUI']);

                StockTransaction::create([
                    'material_id' => $lossReport->material_id,
                    'branch_id' => $lossReport->branch_id,
                    'area_id' => $lossReport->area_id,
                    'ticket_id' => $lossReport->ticket_id,
                    'user_id' => $actor->id,
                    'created_by' => $actor->id,
                    'transaction_type' => 'LOSS',
                    'type' => 'LOSS',
                    'quantity' => $lossReport->quantity,
                    'unit_price' => $lossReport->unit_price,
                    'total_price' => $lossReport->total_price,
                    'reference_type' => LossReport::class,
                    'reference_id' => (string) $lossReport->id,
                    'notes' => $lossReport->reason,
                ]);
            });

            LossApproved::dispatch($lossReport->fresh());
        } elseif ($data['decision'] === 'REJECT') {
            $lossReport->update([
                'status' => 'DITOLAK',
                'rejected_reason' => $data['reason'],
            ]);
        } else {
            $lossReport->update(['status' => 'DALAM_INVESTIGASI']);
        }

        $auditLogger->write(
            action: 'loss.reviewed',
            module: 'stock',
            entityType: LossReport::class,
            entityId: $lossReport->id,
            beforeState: $before,
            afterState: $lossReport->fresh()->toArray(),
            userId: $actor->id,
            branchId: $lossReport->branch_id,
            areaId: $lossReport->area_id,
            request: $request,
        );

        return response()->json(['success' => true, 'message' => 'Loss report updated', 'data' => $lossReport->fresh()]);
    }
}
