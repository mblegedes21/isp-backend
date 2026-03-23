<?php

namespace App\Http\Controllers\Technician;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;

class TechnicianProductController extends Controller
{
    public function search(Request $request)
    {
        $q = $request->input('q');
        $products = Product::where('name', 'like', "%{$q}%")
            ->orWhere('sku', 'like', "%{$q}%")
            ->limit(10)
            ->get(['id', 'sku', 'name']);

        return response()->json($products);
    }
}
