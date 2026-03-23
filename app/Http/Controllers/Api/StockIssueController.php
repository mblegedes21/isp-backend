<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\Product;
use App\Models\StockIssue;
use App\Models\StockTransaction;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockIssueController extends Controller
{
    public function index(Request $request)
    {
        $query = StockIssue::query()->with(['material:id,name,sku', 'branch:id,name', 'area:id,name', 'ticket:id,nomor_ticket'])->latest();

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
            'area_id' => ['nullable', 'exists:areas,id'],
            'ticket_id' => ['nullable', 'exists:tickets,id'],
            'issued_to' => ['nullable'],
            'technician' => ['nullable'],
            'quantity' => ['required', 'integer', 'min:1'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'transaction_type' => ['nullable', 'in:OUT,RETURN'],
            'notes' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
        ]);
        $data['notes'] = $data['notes'] ?? $data['description'] ?? null;
        if (!isset($data['branch_id']) && isset($data['branch'])) {
            $data['branch_id'] = DB::table('branches')->where('name', $data['branch'])->orWhere('code', $data['branch'])->value('id');
        }
        $issuedTo = $data['issued_to'] ?? $data['technician'] ?? null;
        if (!is_null($issuedTo) && !is_numeric($issuedTo)) {
            $issuedTo = User::query()->where('name', $issuedTo)->value('id');
        }
        $data['issued_to'] = $issuedTo;

        $result = DB::transaction(function () use ($data, $request, $auditLogger) {
            $material = Material::query()->lockForUpdate()->findOrFail($data['material_id']);
            abort_if((int) $material->stock < (int) $data['quantity'], 422, 'Stok material tidak mencukupi.');
            $before = $material->toArray();

            $material->update([
                'stock' => (int) $material->stock - (int) $data['quantity'],
            ]);
            Product::query()->whereKey($material->id)->update([
                'stok' => $material->stock,
            ]);

            $issue = StockIssue::query()->create([
                ...$data,
                'issued_by' => $request->user()?->id,
            ]);

            $transaction = StockTransaction::query()->create([
                'material_id' => $material->id,
                'branch_id' => $data['branch_id'],
                'area_id' => $data['area_id'] ?? null,
                'ticket_id' => $data['ticket_id'] ?? null,
                'user_id' => $request->user()?->id,
                'created_by' => $request->user()?->id,
                'transaction_type' => $data['transaction_type'] ?? 'OUT',
                'type' => $data['transaction_type'] ?? 'OUT',
                'quantity' => $data['quantity'],
                'unit_price' => $data['unit_price'],
                'total_price' => $data['unit_price'] * $data['quantity'],
                'reference_type' => StockIssue::class,
                'reference_id' => (string) $issue->id,
                'notes' => $data['notes'] ?? null,
            ]);

            $auditLogger->write(
                action: 'stock.issue.created',
                module: 'warehouse',
                entityType: StockIssue::class,
                entityId: $issue->id,
                beforeState: $before,
                afterState: ['issue' => $issue->toArray(), 'transaction' => $transaction->toArray(), 'material' => $material->fresh()->toArray()],
                userId: $request->user()?->id,
                branchId: $data['branch_id'],
                areaId: $data['area_id'] ?? null,
                request: $request,
            );

            return [
                'issue' => $issue,
                'transaction' => $transaction,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Stock out recorded',
            'data' => [
                'issue' => $result['issue']->load(['material', 'branch', 'area', 'ticket']),
                'transaction' => $result['transaction'],
            ],
        ], 201);
    }
}
