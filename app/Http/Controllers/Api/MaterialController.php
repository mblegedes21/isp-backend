<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\MaterialBrand;
use App\Models\MaterialCategory;
use App\Models\Product;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class MaterialController extends Controller
{
    public function index(Request $request)
    {
        $query = Material::query()
            ->with(['branch:id,name,code', 'category:id,name', 'brandOption:id,name,category_id'])
            ->latest();

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->filled('brand_id')) {
            $query->where('brand_id', $request->integer('brand_id'));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%")
                    ->orWhereHas('category', fn ($categoryQuery) => $categoryQuery->where('name', 'like', "%{$search}%"));
            });
        }

        return response()->json([
            'success' => true,
            'message' => 'Materials fetched',
            'data' => $query->paginate((int) $request->integer('per_page', 20))->through(fn (Material $material) => $this->serialize($material)),
            'filters' => [
                'categories' => MaterialCategory::query()->orderBy('name')->get(['id', 'name', 'description']),
                'brands' => MaterialBrand::query()->orderBy('name')->get(['id', 'category_id', 'name']),
            ],
        ]);
    }

    public function store(Request $request, AuditLogger $auditLogger)
    {
        $validator = Validator::make($request->all(), [
            'branch_id' => ['required', 'exists:branches,id'],
            'category_id' => ['required', 'exists:material_categories,id'],
            'brand_id' => ['nullable', 'exists:material_brands,id'],
            'brand' => ['nullable', 'string', 'max:120'],
            'name' => ['required_without:material_name', 'string', 'max:150'],
            'material_name' => ['required_without:name', 'string', 'max:150'],
            'sku' => ['required', 'string', 'max:100', 'unique:materials,sku', 'unique:products,sku'],
            'description' => ['nullable', 'string'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'current_stock' => ['required_without:stock', 'integer', 'min:0'],
            'minimum_stock' => ['required', 'integer', 'min:0'],
            'purchase_price' => ['required_without:price', 'numeric', 'min:0'],
            'price' => ['required_without:purchase_price', 'numeric', 'min:0'],
            'unit' => ['required', 'string', 'max:30'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi request gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $this->ensureStandardCategory((int) $data['category_id']);
        $data['name'] = $data['name'] ?? $data['material_name'];
        $data['purchase_price'] = $data['purchase_price'] ?? $data['price'];
        $data['stock'] = $data['stock'] ?? $data['current_stock'];

        $material = DB::transaction(function () use ($data) {
            [$brandId, $brandName] = $this->resolveBrand($data['category_id'], $data['brand_id'] ?? null, $data['brand'] ?? null);
            $material = Material::query()->create([
                'branch_id' => $data['branch_id'],
                'category_id' => $data['category_id'],
                'brand_id' => $brandId,
                'brand' => $brandName,
                'name' => $data['name'],
                'sku' => $data['sku'],
                'unit' => $data['unit'],
                'stock' => $data['stock'],
                'minimum_stock' => $data['minimum_stock'],
                'purchase_price' => $data['purchase_price'],
                'is_active' => $data['is_active'] ?? true,
                'description' => $data['description'] ?? null,
            ]);
            $material->loadMissing('category');

            DB::table('products')->insert([
                'id' => $material->id,
                'branch_id' => $material->branch_id,
                'name' => $material->name,
                'sku' => $material->sku,
                'category' => $material->category?->name,
                'stok' => $material->stock,
                'min_stock' => $material->minimum_stock,
                'unit_type' => $material->unit,
                'is_active' => $material->is_active,
                'description' => $material->description,
                'price' => $material->purchase_price,
                'lead_time_days' => 7,
                'is_serialized' => false,
                'avg_daily_usage' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return $material;
        });

        $auditLogger->write(
            action: 'material.created',
            module: 'warehouse',
            entityType: Material::class,
            entityId: $material->id,
            afterState: $material->toArray(),
            userId: $request->user()?->id,
            branchId: $material->branch_id,
            request: $request,
        );

        return response()->json([
            'success' => true,
            'message' => 'Material created',
            'data' => $this->serialize($material->load(['branch', 'category', 'brandOption'])),
        ], 201);
    }

    public function show(Material $material)
    {
        return response()->json([
            'success' => true,
            'message' => 'Material fetched',
            'data' => $this->serialize($material->load(['branch', 'category', 'brandOption'])),
        ]);
    }

    public function update(Request $request, Material $material, AuditLogger $auditLogger)
    {
        $before = $material->toArray();
        $validator = Validator::make($request->all(), [
            'branch_id' => ['sometimes', 'exists:branches,id'],
            'category_id' => ['sometimes', 'exists:material_categories,id'],
            'brand_id' => ['nullable', 'exists:material_brands,id'],
            'brand' => ['nullable', 'string', 'max:120'],
            'name' => ['sometimes', 'string', 'max:150'],
            'material_name' => ['sometimes', 'string', 'max:150'],
            'sku' => ['sometimes', 'string', 'max:100', Rule::unique('materials', 'sku')->ignore($material->id), Rule::unique('products', 'sku')->ignore($material->id)],
            'description' => ['nullable', 'string'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'current_stock' => ['sometimes', 'integer', 'min:0'],
            'minimum_stock' => ['sometimes', 'integer', 'min:0'],
            'purchase_price' => ['sometimes', 'numeric', 'min:0'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'unit' => ['sometimes', 'string', 'max:30'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi request gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        if (array_key_exists('category_id', $data)) {
            $this->ensureStandardCategory((int) $data['category_id']);
        }
        $data['name'] = $data['name'] ?? $data['material_name'] ?? null;
        $data['purchase_price'] = $data['purchase_price'] ?? $data['price'] ?? null;
        $data['stock'] = $data['stock'] ?? $data['current_stock'] ?? null;

        DB::transaction(function () use ($data, $material) {
            [$brandId, $brandName] = $this->resolveBrand(
                $data['category_id'] ?? $material->category_id,
                $data['brand_id'] ?? $material->brand_id,
                $data['brand'] ?? $material->brand
            );
            $material->update([
                'branch_id' => $data['branch_id'] ?? $material->branch_id,
                'category_id' => $data['category_id'] ?? $material->category_id,
                'brand_id' => $brandId,
                'brand' => $brandName,
                'name' => $data['name'] ?? $material->name,
                'sku' => $data['sku'] ?? $material->sku,
                'stock' => $data['stock'] ?? $material->stock,
                'minimum_stock' => $data['minimum_stock'] ?? $material->minimum_stock,
                'purchase_price' => $data['purchase_price'] ?? $material->purchase_price,
                'unit' => $data['unit'] ?? $material->unit,
                'is_active' => $data['is_active'] ?? $material->is_active,
                'description' => array_key_exists('description', $data) ? $data['description'] : $material->description,
            ]);

            Product::query()->whereKey($material->id)->update([
                'branch_id' => $material->branch_id,
                'name' => $material->name,
                'sku' => $material->sku,
                'category' => $material->fresh('category')->category?->name,
                'stok' => $material->stock,
                'min_stock' => $material->minimum_stock,
                'unit_type' => $material->unit,
                'is_active' => $material->is_active,
                'description' => $material->description,
                'price' => $material->purchase_price,
            ]);
        });

        $auditLogger->write(
            action: 'material.updated',
            module: 'warehouse',
            entityType: Material::class,
            entityId: $material->id,
            beforeState: $before,
            afterState: $material->fresh()->toArray(),
            userId: $request->user()?->id,
            branchId: $material->branch_id,
            request: $request,
        );

        return response()->json([
            'success' => true,
            'message' => 'Material updated',
            'data' => $this->serialize($material->fresh()->load(['branch', 'category', 'brandOption'])),
        ]);
    }

    public function destroy(Request $request, Material $material, AuditLogger $auditLogger)
    {
        $before = $material->toArray();
        abort_if(
            DB::table('stock_transactions')->where('material_id', $material->id)->exists()
            || DB::table('stock_receipts')->where('material_id', $material->id)->exists()
            || DB::table('stock_issues')->where('material_id', $material->id)->exists()
            || DB::table('stock_transfers')->where('material_id', $material->id)->exists()
            || DB::table('loss_reports')->where('material_id', $material->id)->exists()
            || DB::table('ticket_materials')->where('product_id', $material->id)->exists(),
            422,
            'Material sudah memiliki transaksi. Gunakan nonaktifkan material.'
        );

        DB::transaction(function () use ($material) {
            Product::query()->whereKey($material->id)->delete();
            $material->delete();
        });

        $auditLogger->write(
            action: 'material.deleted',
            module: 'warehouse',
            entityType: Material::class,
            entityId: $material->id,
            beforeState: $before,
            afterState: null,
            userId: $request->user()?->id,
            branchId: $material->branch_id,
            request: $request,
        );

        return response()->json(['success' => true, 'message' => 'Material deleted', 'data' => null]);
    }

    private function resolveBrand(int $categoryId, ?int $brandId, ?string $brandName): array
    {
        if ($brandId) {
            $brand = MaterialBrand::query()->whereKey($brandId)->where('category_id', $categoryId)->first();
            if ($brand) {
                return [$brand->id, $brand->name];
            }
        }

        $normalizedBrand = trim((string) $brandName);
        if ($normalizedBrand === '') {
            return [null, null];
        }

        $brand = MaterialBrand::query()->firstOrCreate(
            ['category_id' => $categoryId, 'name' => $normalizedBrand],
            []
        );

        return [$brand->id, $brand->name];
    }

    private function ensureStandardCategory(int $categoryId): void
    {
        $category = MaterialCategory::query()->findOrFail($categoryId);

        abort_unless(
            in_array($category->name, MaterialCategory::allowedNames(), true),
            422,
            'Kategori material tidak valid.'
        );
    }

    private function serialize(Material $material): array
    {
        $stock = (int) ($material->stock ?? 0);
        $materialLabel = trim(collect([$material->brand, $material->name])->filter()->implode(' '));
        $availability = $stock > 0 ? 'TERSEDIA' : 'HABIS';
        $inventoryStatus = $stock <= (int) ($material->minimum_stock ?? 0) ? 'LOW_STOCK' : 'NORMAL';

        return [
            'id' => $material->id,
            'branch_id' => $material->branch_id,
            'branch_name' => $material->branch?->name,
            'category_id' => $material->category_id,
            'category_name' => $material->category?->name,
            'brand_id' => $material->brand_id,
            'brand_name' => $material->brand,
            'name' => $material->name,
            'material_name' => $materialLabel ?: $material->name,
            'model' => $material->name,
            'sku' => $material->sku,
            'category' => $material->category?->name,
            'description' => $material->description,
            'stock' => $stock,
            'minimum_stock' => (int) ($material->minimum_stock ?? 0),
            'price' => (float) $material->purchase_price,
            'purchase_price' => (float) $material->purchase_price,
            'unit' => $material->unit ?? 'pcs',
            'is_active' => (bool) $material->is_active,
            'status' => $availability,
            'inventory_status' => $inventoryStatus,
            'created_at' => $material->created_at,
            'updated_at' => $material->updated_at,
        ];
    }
}
