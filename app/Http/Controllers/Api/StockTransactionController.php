<?php

namespace App\Http\Controllers\Api;

use App\Events\LossReported;
use App\Http\Controllers\Controller;
use App\Jobs\RecalculateManagerStatistics;
use App\Models\LossReport;
use App\Models\Material;
use App\Models\Product;
use App\Models\Ticket;
use App\Models\StockTransaction;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StockTransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = StockTransaction::with(['material:id,name,sku', 'area:id,name,code', 'ticket:id,nomor_ticket,title', 'branch:id,name,code', 'user:id,name'])
            ->latest();

        if ($request->filled('type')) {
            $query->where('transaction_type', $request->string('type'));
        }

        if ($request->filled('area_id')) {
            $query->where('area_id', $request->integer('area_id'));
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        if ($request->filled('material_id')) {
            $query->where('material_id', $request->integer('material_id'));
        }

        return response()->json($query->paginate((int) $request->integer('per_page', 30)));
    }

    public function store(Request $request, AuditLogger $auditLogger)
    {
        $data = $request->validate([
            'material_id' => ['required', 'exists:materials,id'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'area_id' => ['nullable', 'exists:areas,id'],
            'ticket_id' => ['nullable', 'exists:tickets,id'],
            'transaction_type' => ['required', Rule::in(StockTransaction::TYPES)],
            'quantity' => ['required', 'integer', 'min:1'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'reference_type' => ['nullable', 'string', 'max:60'],
            'reference_id' => ['nullable', 'string', 'max:60'],
        ]);

        $ticket = !empty($data['ticket_id']) ? Ticket::query()->find($data['ticket_id']) : null;
        $data['branch_id'] = $data['branch_id'] ?? $ticket?->branch_id;
        $data['user_id'] = $request->user()?->id;
        $data['created_by'] = $request->user()?->id;

        $transaction = DB::transaction(function () use ($data, $ticket) {
            $material = Material::query()->lockForUpdate()->findOrFail($data['material_id']);

            if (in_array($data['transaction_type'], ['OUT', 'LOSS', 'TRANSFER'], true)) {
                abort_if((int) $material->stock < (int) $data['quantity'], 422, 'Stok material tidak mencukupi.');
                $material->update(['stock' => (int) $material->stock - (int) $data['quantity']]);
            }

            if (in_array($data['transaction_type'], ['IN', 'RETURN'], true)) {
                $material->update(['stock' => (int) $material->stock + (int) $data['quantity']]);
            }

            Product::query()->whereKey($material->id)->update([
                'stok' => $material->stock,
                'branch_id' => $material->branch_id,
            ]);

            $transaction = StockTransaction::create([
                ...$data,
                'type' => $data['transaction_type'],
                'total_price' => $data['quantity'] * $data['unit_price'],
            ]);

            if ($transaction->transaction_type === 'LOSS') {
                $lossReport = LossReport::create([
                    'ticket_id' => $transaction->ticket_id,
                    'branch_id' => $transaction->branch_id,
                    'area_id' => $transaction->area_id,
                    'material_id' => $transaction->material_id,
                    'technician_id' => $ticket?->technician_id,
                    'quantity' => $transaction->quantity,
                    'unit_price' => $transaction->unit_price,
                    'total_price' => $transaction->total_price,
                    'reason' => 'Loss generated from stock transaction.',
                    'status' => 'MENUNGGU',
                ]);

                LossReported::dispatch($lossReport);
            }

            return $transaction;
        });

        $auditLogger->write(
            action: 'stock.transaction.created',
            module: 'stock',
            entityType: StockTransaction::class,
            entityId: $transaction->id,
            afterState: $transaction->toArray(),
            userId: $request->user()?->id,
            branchId: $transaction->branch_id,
            areaId: $transaction->area_id,
            request: $request,
        );

        RecalculateManagerStatistics::dispatch();

        return response()->json($transaction->load(['material', 'area', 'ticket']), 201);
    }
}
