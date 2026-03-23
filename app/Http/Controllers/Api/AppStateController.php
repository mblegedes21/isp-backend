<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FrontendStateBuilder;

class AppStateController extends Controller
{
    public function __invoke(FrontendStateBuilder $builder)
    {
        return response()->json($builder->build());
    }
}
