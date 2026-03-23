<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\PurchaseRequest;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = PurchaseRequest::query()
            ->with(['material:id,name,brand,branch_id,purchase_price', 'branch:id,name', 'requester:id,name'])
            ->latest();

        if ($user?->isWarehouse() && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        return response()->json([
            'success' => true,
            'message' => 'Purchase requests fetched',
            'data' => $query->paginate((int) $request->integer('per_page', 20)),
        ]);
    }

    public function store(Request $request, AuditLogger $auditLogger): JsonResponse
    {
        $data = $request->validate([
            'material_id' => ['required', 'exists:materials,id'],
            'branch_id' => ['required', 'exists:branches,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'estimated_price' => ['required_without:price', 'numeric', 'min:0'],
            'price' => ['required_without:estimated_price', 'numeric', 'min:0'],
            'supplier' => ['nullable', 'string', 'max:150'],
            'notes' => ['nullable', 'string'],
        ]);
        $data['estimated_price'] = $data['estimated_price'] ?? $data['price'];

        $material = Material::query()->findOrFail($data['material_id']);
        $user = $request->user();

        if ($user?->isWarehouse() && $user->branch_id && (int) $data['branch_id'] !== (int) $user->branch_id) {
            abort(403, 'Warehouse hanya dapat membuat permintaan untuk cabangnya sendiri.');
        }

        $purchaseRequest = PurchaseRequest::query()->create([
            ...$data,
            'requested_by' => $user?->id,
            'status' => PurchaseRequest::STATUS_PENDING,
        ]);

        $auditLogger->write(
            action: 'purchase-request.created',
            module: 'warehouse',
            entityType: PurchaseRequest::class,
            entityId: $purchaseRequest->id,
            afterState: $purchaseRequest->toArray(),
            userId: $request->user()?->id,
            branchId: $purchaseRequest->branch_id,
            request: $request,
        );

        return response()->json([
            'success' => true,
            'message' => 'Purchase request created',
            'data' => $this->serialize($purchaseRequest->load(['material', 'branch', 'requester']), $material),
        ], 201);
    }

    public function approve(Request $request, PurchaseRequest $purchaseRequest, AuditLogger $auditLogger): JsonResponse
    {
        $this->ensureManager($request);
        $this->ensureStatusTransition($purchaseRequest, PurchaseRequest::STATUS_PENDING, 'Hanya purchase request dengan status PENDING yang dapat disetujui.');

        $before = $purchaseRequest->toArray();
        $purchaseRequest->update(['status' => PurchaseRequest::STATUS_APPROVED]);

        $auditLogger->write(
            action: 'purchase-request.approved',
            module: 'warehouse',
            entityType: PurchaseRequest::class,
            entityId: $purchaseRequest->id,
            beforeState: $before,
            afterState: $purchaseRequest->fresh()->toArray(),
            userId: $request->user()?->id,
            branchId: $purchaseRequest->branch_id,
            request: $request,
        );

        return response()->json([
            'success' => true,
            'message' => 'Purchase request approved',
            'data' => $this->serialize($purchaseRequest->fresh()->load(['material', 'branch', 'requester'])),
        ]);
    }

    public function reject(Request $request, PurchaseRequest $purchaseRequest, AuditLogger $auditLogger): JsonResponse
    {
        $this->ensureManager($request);
        $this->ensureStatusTransition($purchaseRequest, PurchaseRequest::STATUS_PENDING, 'Hanya purchase request dengan status PENDING yang dapat ditolak.');

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $before = $purchaseRequest->toArray();
        $purchaseRequest->update([
            'status' => PurchaseRequest::STATUS_REJECTED,
            'notes' => trim(collect([$purchaseRequest->notes, $validated['reason'] ?? null])->filter()->implode("\n")),
        ]);

        $auditLogger->write(
            action: 'purchase-request.rejected',
            module: 'warehouse',
            entityType: PurchaseRequest::class,
            entityId: $purchaseRequest->id,
            beforeState: $before,
            afterState: $purchaseRequest->fresh()->toArray(),
            userId: $request->user()?->id,
            branchId: $purchaseRequest->branch_id,
            request: $request,
        );

        return response()->json([
            'success' => true,
            'message' => 'Purchase request rejected',
            'data' => $this->serialize($purchaseRequest->fresh()->load(['material', 'branch', 'requester'])),
        ]);
    }

    public function resend(Request $request, PurchaseRequest $purchaseRequest, AuditLogger $auditLogger): JsonResponse
    {
        $this->ensureWarehouse($request);
        $this->ensureWarehouseBranchAccess($request, $purchaseRequest);
        $this->ensureStatusTransition($purchaseRequest, PurchaseRequest::STATUS_REJECTED, 'Hanya purchase request dengan status REJECTED yang dapat dikirim ulang.');

        $before = $purchaseRequest->toArray();
        $purchaseRequest->update([
            'status' => PurchaseRequest::STATUS_PENDING,
            'requested_by' => $request->user()?->id,
        ]);

        $auditLogger->write(
            action: 'purchase-request.resent',
            module: 'warehouse',
            entityType: PurchaseRequest::class,
            entityId: $purchaseRequest->id,
            beforeState: $before,
            afterState: $purchaseRequest->fresh()->toArray(),
            userId: $request->user()?->id,
            branchId: $purchaseRequest->branch_id,
            request: $request,
        );

        return response()->json([
            'success' => true,
            'message' => 'Purchase request berhasil dikirim ulang',
            'data' => $this->serialize($purchaseRequest->fresh()->load(['material', 'branch', 'requester'])),
        ]);
    }

    private function serialize(PurchaseRequest $purchaseRequest, ?Material $material = null): array
    {
        $material ??= $purchaseRequest->material;

        return [
            'id' => $purchaseRequest->id,
            'material_id' => $purchaseRequest->material_id,
            'material_name' => trim(collect([$material?->brand, $material?->name])->filter()->implode(' ')),
            'branch_id' => $purchaseRequest->branch_id,
            'branch_name' => $purchaseRequest->branch?->name,
            'requested_by' => $purchaseRequest->requested_by,
            'requested_by_name' => $purchaseRequest->requester?->name,
            'quantity' => (int) $purchaseRequest->quantity,
            'estimated_price' => (float) $purchaseRequest->estimated_price,
            'supplier' => $purchaseRequest->supplier,
            'notes' => $purchaseRequest->notes,
            'status' => $purchaseRequest->status,
            'created_at' => $purchaseRequest->created_at,
        ];
    }

    private function ensureManager(Request $request): void
    {
        abort_unless($request->user()?->isManager(), 403, 'Hanya manager yang dapat melakukan aksi ini.');
    }

    private function ensureWarehouse(Request $request): void
    {
        abort_unless($request->user()?->isWarehouse(), 403, 'Hanya warehouse yang dapat melakukan aksi ini.');
    }

    private function ensureWarehouseBranchAccess(Request $request, PurchaseRequest $purchaseRequest): void
    {
        $user = $request->user();

        abort_unless(
            !$user?->branch_id || (int) $purchaseRequest->branch_id === (int) $user->branch_id,
            403,
            'Purchase request ini bukan milik cabang Anda.'
        );
    }

    private function ensureStatusTransition(PurchaseRequest $purchaseRequest, string $expectedStatus, string $message): void
    {
        abort_unless($purchaseRequest->status === $expectedStatus, 422, $message);
    }
}
