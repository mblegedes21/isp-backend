<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ProductsController extends Controller
{
    public function index()
    {
        $products = [
            ['id' => 1, 'sku' => 'ONU-X', 'name' => 'ONU Model X', 'stock' => 120],
            ['id' => 2, 'sku' => 'SPL-1:8', 'name' => 'Splitter 1:8', 'stock' => 60],
        ];
        return view('inventory.products.index', compact('products'));
    }

    public function create()
    {
        return view('inventory.products.create');
    }

    public function edit($id)
    {
        $product = ['id' => $id, 'sku' => 'P-' . $id, 'name' => 'Sample Product', 'stock' => 10];
        return view('inventory.products.edit', compact('product'));
    }
}
