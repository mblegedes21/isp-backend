<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class FieldController extends Controller
{
    public function install()
    {
        $dummy = [
            'ticket' => 'TCK-20260225-01',
            'customer' => 'PT. Contoh Pelanggan',
            'serials' => ['SN-A10001']
        ];

        return view('field.install', compact('dummy'));
    }
}
