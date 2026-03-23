<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\Product;
use App\Models\StockTransaction;
use App\Models\User;
use App\Models\WarehouseTransaction;
use App\Services\AuditLogger;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class WarehouseTransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'type' => ['nullable', 'string', 'max:60'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        try {
            $query = WarehouseTransaction::query()
                ->with([
                    'material:id,name,brand,unit',
                    'technician:id,name',
                    'ticket:id,nomor_ticket',
                    'purchaseRequest:id',
                    'creator:id,name',
                ])
                ->latest();

            if ($request->filled('type')) {
                $query->whereIn('transaction_type', $this->resolveHistoryTypes($request->string('type')->toString()));
            }

            $totalsQuery = clone $query;
            $totals = [
                'quantity' => (int) $totalsQuery->sum('quantity'),
                'value' => (float) $totalsQuery->sum('total_price'),
            ];

            $paginator = $query->paginate((int) $request->integer('per_page', 50));

            return response()->json([
                'success' => true,
                'message' => 'Warehouse transactions fetched',
                'data' => [
                    'data' => collect($paginator->items())
                        ->map(fn (WarehouseTransaction $transaction) => $this->serialize($transaction))
                        ->values(),
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'totals' => $totals,
                ],
            ]);
        } catch (QueryException $exception) {
            Log::error('warehouse.transactions.index', [
                'error' => $exception->getMessage(),
                'payload' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat riwayat transaksi gudang.',
                'errors' => [
                    'warehouse_transactions' => [$exception->getMessage()],
                ],
                'data' => [
                    'data' => [],
                ],
            ], 500);
        }
    }

    public function store(Request $request, AuditLogger $auditLogger): JsonResponse
    {
        $data = $request->validate([
            'material_id' => ['required', 'exists:materials,id'],
            'transaction_type' => ['required', Rule::in(WarehouseTransaction::TYPES)],
            'quantity' => ['required', 'integer', 'min:1'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
            'source_branch' => ['nullable', 'string', 'max:150'],
            'destination_branch' => ['nullable', 'string', 'max:150'],
            'technician_id' => ['nullable', 'exists:users,id'],
            'technician_name' => ['nullable', 'string', 'max:150'],
            'supplier' => ['nullable', 'string', 'max:150'],
            'customer' => ['nullable', 'string', 'max:150'],
            'ticket_id' => ['nullable', 'exists:tickets,id'],
            'purchase_request_id' => ['nullable', 'exists:purchase_requests,id'],
            'condition' => ['nullable', 'string', 'max:80'],
            'status' => ['nullable', 'string', 'max:40'],
            'notes' => ['nullable', 'string'],
        ]);

        $data['technician_id'] = $this->resolveTechnicianId($data['technician_id'] ?? null, $data['technician_name'] ?? null);
        $data['unit_price'] = (float) ($data['unit_price'] ?? 0);
        $data['status'] = $data['status'] ?? $this->defaultStatus($data['transaction_type']);
        $data['total_price'] = (int) $data['quantity'] * (float) $data['unit_price'];

        if ($this->requiresTechnician($data['transaction_type']) && !$data['technician_id']) {
            return response()->json([
                'success' => false,
                'message' => 'Teknisi wajib dipilih untuk transaksi material teknisi.',
                'errors' => [
                    'technician_id' => ['Teknisi wajib dipilih untuk transaksi material teknisi.'],
                ],
                'data' => null,
            ], 422);
        }

        $this->validateByType($data, $request);

        $transaction = DB::transaction(function () use ($data, $request) {
            $material = Material::query()->lockForUpdate()->findOrFail($data['material_id']);

            if (in_array($data['transaction_type'], WarehouseTransaction::OUTBOUND_TYPES, true)) {
                abort_if((int) $material->stock < (int) $data['quantity'], 422, 'Stok material tidak mencukupi.');
                $material->stock = (int) $material->stock - (int) $data['quantity'];
            } else {
                $material->stock = (int) $material->stock + (int) $data['quantity'];
                if ($request->user()?->branch_id) {
                    $material->branch_id = $request->user()?->branch_id;
                }
            }

            $material->save();

            Product::query()->whereKey($material->id)->update([
                'stok' => $material->stock,
                'branch_id' => $material->branch_id,
            ]);

            $transaction = WarehouseTransaction::query()->create([
                ...$data,
                'created_by' => $request->user()?->id,
            ]);

            StockTransaction::query()->create([
                'material_id' => $material->id,
                'branch_id' => $material->branch_id,
                'ticket_id' => $data['ticket_id'] ?? null,
                'user_id' => $request->user()?->id,
                'created_by' => $request->user()?->id,
                'transaction_type' => $this->legacyType($data['transaction_type']),
                'type' => $this->legacyType($data['transaction_type']),
                'quantity' => $data['quantity'],
                'unit_price' => $data['unit_price'],
                'total_price' => $data['total_price'],
                'reference_type' => WarehouseTransaction::class,
                'reference_id' => (string) $transaction->id,
                'notes' => $data['notes'] ?? null,
            ]);

            return $transaction;
        });

        $transaction->load(['material', 'technician', 'ticket', 'purchaseRequest', 'creator']);

        $auditLogger->write(
            action: 'warehouse-transaction.created',
            module: 'warehouse',
            entityType: WarehouseTransaction::class,
            entityId: $transaction->id,
            afterState: $transaction->toArray(),
            userId: $request->user()?->id,
            branchId: $request->user()?->branch_id,
            request: $request,
        );

        return response()->json([
            'success' => true,
            'message' => 'Warehouse transaction created',
            'data' => $this->serialize($transaction),
        ], 201);
    }

    private function validateByType(array $data, Request $request): void
    {
        $rules = match ($data['transaction_type']) {
            WarehouseTransaction::TYPE_ANTAR_GUDANG_IN => [
                'source_branch' => ['required', 'string', 'max:150'],
                'unit_price' => ['required', 'numeric', 'min:0'],
            ],
            WarehouseTransaction::TYPE_PENGEMBALIAN_TEKNISI => [
                'technician_id' => ['required', 'exists:users,id'],
                'ticket_id' => ['required', 'exists:tickets,id'],
                'condition' => ['required', 'string', 'max:80'],
            ],
            WarehouseTransaction::TYPE_PEMBELIAN_MATERIAL => [
                'supplier' => ['required', 'string', 'max:150'],
                'unit_price' => ['required', 'numeric', 'min:0'],
            ],
            WarehouseTransaction::TYPE_ANTAR_GUDANG_OUT => [
                'destination_branch' => ['required', 'string', 'max:150'],
                'unit_price' => ['required', 'numeric', 'min:0'],
            ],
            WarehouseTransaction::TYPE_PENGELUARAN_TEKNISI => [
                'technician_id' => ['required', 'exists:users,id'],
                'ticket_id' => ['required', 'exists:tickets,id'],
            ],
            WarehouseTransaction::TYPE_PENJUALAN_MATERIAL => [
                'customer' => ['required', 'string', 'max:150'],
                'unit_price' => ['required', 'numeric', 'min:0'],
            ],
            WarehouseTransaction::TYPE_TECHNICIAN_OUT => [
                'technician_id' => ['required', 'exists:users,id'],
                'ticket_id' => ['required', 'exists:tickets,id'],
            ],
            WarehouseTransaction::TYPE_TECHNICIAN_RETURN => [
                'technician_id' => ['required', 'exists:users,id'],
                'ticket_id' => ['required', 'exists:tickets,id'],
            ],
            default => [],
        };

        Validator::make($data, $rules, [
            'technician_id.required' => 'Teknisi wajib dipilih.',
            'technician_id.exists' => 'Teknisi yang dipilih tidak valid.',
            'ticket_id.required' => 'Ticket wajib dipilih.',
            'ticket_id.exists' => 'Ticket yang dipilih tidak valid.',
            'source_branch.required' => 'Source branch wajib diisi.',
            'destination_branch.required' => 'Destination branch wajib diisi.',
            'supplier.required' => 'Supplier wajib diisi.',
            'customer.required' => 'Customer wajib diisi.',
            'condition.required' => 'Kondisi material wajib diisi.',
            'unit_price.required' => 'Unit price wajib diisi.',
        ])->validate();
    }

    private function resolveTechnicianId(int|string|null $technicianId, ?string $technicianName): ?int
    {
        if (!is_null($technicianId) && $technicianId !== '') {
            return (int) $technicianId;
        }

        if ($technicianName) {
            return User::query()
                ->where('role', User::ROLE_TEKNISI)
                ->where('name', $technicianName)
                ->value('id');
        }

        return null;
    }

    private function requiresTechnician(string $transactionType): bool
    {
        return in_array($transactionType, [
            WarehouseTransaction::TYPE_PENGEMBALIAN_TEKNISI,
            WarehouseTransaction::TYPE_PENGELUARAN_TEKNISI,
            WarehouseTransaction::TYPE_TECHNICIAN_OUT,
            WarehouseTransaction::TYPE_TECHNICIAN_RETURN,
        ], true);
    }

    private function defaultStatus(string $transactionType): string
    {
        return match ($transactionType) {
            WarehouseTransaction::TYPE_PEMBELIAN_MATERIAL => 'RECEIVED',
            WarehouseTransaction::TYPE_ANTAR_GUDANG_OUT => 'SENT',
            WarehouseTransaction::TYPE_ANTAR_GUDANG_IN => 'RECEIVED',
            WarehouseTransaction::TYPE_TECHNICIAN_OUT => 'RELEASED',
            WarehouseTransaction::TYPE_TECHNICIAN_RETURN => 'RETURNED',
            default => 'COMPLETED',
        };
    }

    private function legacyType(string $transactionType): string
    {
        return match ($transactionType) {
            WarehouseTransaction::TYPE_ANTAR_GUDANG_IN,
            WarehouseTransaction::TYPE_PEMBELIAN_MATERIAL => 'IN',
            WarehouseTransaction::TYPE_PENGEMBALIAN_TEKNISI => 'RETURN',
            WarehouseTransaction::TYPE_ANTAR_GUDANG_OUT => 'TRANSFER',
            WarehouseTransaction::TYPE_TECHNICIAN_RETURN => 'RETURN',
            default => 'OUT',
        };
    }

    private function serialize(WarehouseTransaction $transaction): array
    {
        $historyType = $this->normalizeHistoryType($transaction->transaction_type);

        return [
            'id' => $transaction->id,
            'material_id' => $transaction->material_id,
            'material_name' => trim(collect([$transaction->material?->brand, $transaction->material?->name])->filter()->implode(' ')),
            'unit' => $transaction->material?->unit,
            'transaction_type' => $transaction->transaction_type,
            'history_type' => $historyType,
            'quantity' => (int) $transaction->quantity,
            'unit_price' => (float) $transaction->unit_price,
            'total_price' => (float) $transaction->total_price,
            'total_value' => (float) $transaction->total_price,
            'source_branch' => $transaction->source_branch,
            'destination_branch' => $transaction->destination_branch,
            'technician_id' => $transaction->technician_id,
            'technician_name' => $transaction->technician?->name,
            'supplier' => $transaction->supplier,
            'customer' => $transaction->customer,
            'ticket_id' => $transaction->ticket_id,
            'ticket_number' => $transaction->ticket?->nomor_ticket,
            'purchase_request_id' => $transaction->purchase_request_id,
            'condition' => $transaction->condition,
            'status' => $transaction->status,
            'notes' => $transaction->notes,
            'created_by' => $transaction->created_by,
            'created_by_name' => $transaction->creator?->name,
            'created_at' => optional($transaction->created_at)->toISOString(),
        ];
    }

    private function resolveHistoryTypes(string $requestedType): array
    {
        return match ($requestedType) {
            WarehouseTransaction::TYPE_PENGELUARAN_TEKNISI => [
                WarehouseTransaction::TYPE_PENGELUARAN_TEKNISI,
                WarehouseTransaction::TYPE_TECHNICIAN_OUT,
            ],
            WarehouseTransaction::TYPE_PENGEMBALIAN_TEKNISI => [
                WarehouseTransaction::TYPE_PENGEMBALIAN_TEKNISI,
                WarehouseTransaction::TYPE_TECHNICIAN_RETURN,
            ],
            default => in_array($requestedType, WarehouseTransaction::TYPES, true) ? [$requestedType] : WarehouseTransaction::TYPES,
        };
    }

    private function normalizeHistoryType(string $transactionType): string
    {
        return match ($transactionType) {
            WarehouseTransaction::TYPE_TECHNICIAN_OUT => WarehouseTransaction::TYPE_PENGELUARAN_TEKNISI,
            WarehouseTransaction::TYPE_TECHNICIAN_RETURN => WarehouseTransaction::TYPE_PENGEMBALIAN_TEKNISI,
            default => $transactionType,
        };
    }
}
