<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TechnicianDashboardController;
use App\Http\Controllers\LeaderDashboardController;
use App\Http\Controllers\GudangDashboardController;
use App\Http\Controllers\ManagerDashboardController;
use App\Http\Controllers\RequestsController;
use App\Http\Controllers\ProductsController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('technician.dashboard');
});

Route::get('/dashboard', function () {
    return redirect()->route('technician.dashboard');
});

Route::post('/set-role', function (Illuminate\Http\Request $request) {
    session(['demo_role' => $request->role]);
    return back();
})->name('role.set');

Route::post('/set-location', function (Illuminate\Http\Request $request) {
    session(['demo_location' => $request->location]);
    return back();
})->name('location.set');

// DEV MODE: Temporary debug route
Route::get('/dev-test', function () {
    return 'DEV MODE ACTIVE';
});

// ==========================================
// DEV MODE ROUTES - NO MIDDLEWARE RESTRICTIONS
// ==========================================

// TECHNICIAN ROUTES
Route::prefix('technician')
    ->name('technician.')
    ->group(function () {
        Route::get('/dashboard', [TechnicianDashboardController::class, 'index'])->name('dashboard');
        Route::get('/permintaan/create', [\App\Http\Controllers\Technician\TechnicianRequestController::class, 'create'])->name('permintaan.create');
        Route::post('/permintaan/store', [\App\Http\Controllers\Technician\TechnicianRequestController::class, 'store'])->name('permintaan.store');
        Route::get('/tickets', [\App\Http\Controllers\Technician\TechnicianTicketController::class, 'index'])->name('tickets.index');
        Route::get('/tickets/create', [\App\Http\Controllers\Technician\TechnicianTicketController::class, 'create'])->name('tickets.create');
        Route::post('/tickets/store', [\App\Http\Controllers\Technician\TechnicianTicketController::class, 'store'])->name('tickets.store');
        Route::get('/tickets/{id}', [\App\Http\Controllers\Technician\TechnicianTicketController::class, 'show'])->name('tickets.show');
        Route::post('/tickets/{id}/progress', [\App\Http\Controllers\Technician\TechnicianTicketController::class, 'storeProgress'])->name('tickets.progress');
        Route::post('/tickets/{id}/close', [\App\Http\Controllers\Technician\TechnicianTicketController::class, 'close'])->name('tickets.close');
});

// LEADER ROUTES
Route::prefix('leader')
    ->name('leader.')
    ->group(function () {
        Route::get('/dashboard', [LeaderDashboardController::class, 'index'])->name('dashboard');
        Route::get('/permintaan', [\App\Http\Controllers\Leader\LeaderRequestController::class, 'index'])->name('permintaan.index');
        Route::get('/permintaan/{id}', [\App\Http\Controllers\Leader\LeaderRequestController::class, 'show'])->name('permintaan.show');
        Route::post('/permintaan/{id}/approve', [\App\Http\Controllers\Leader\LeaderRequestController::class, 'approve'])->name('permintaan.approve');
        Route::post('/permintaan/{id}/reject', [\App\Http\Controllers\Leader\LeaderRequestController::class, 'reject'])->name('permintaan.reject');
});

// GUDANG ROUTES
Route::prefix('gudang')
    ->name('gudang.')
    ->group(function () {
        Route::get('/dashboard', [GudangDashboardController::class, 'index'])->name('dashboard');
        Route::get('/permintaan', [\App\Http\Controllers\Gudang\GudangRequestController::class, 'index'])->name('permintaan.index');
        Route::get('/permintaan/{id}', [\App\Http\Controllers\Gudang\GudangRequestController::class, 'show'])->name('permintaan.show');
        Route::post('/permintaan/{id}/approve', [\App\Http\Controllers\Gudang\GudangRequestController::class, 'approve'])->name('permintaan.approve');
        Route::get('/transfer', [\App\Http\Controllers\Gudang\GudangTransferController::class, 'index'])->name('transfer.index');
        Route::get('/transfer/{id}', [\App\Http\Controllers\Gudang\GudangTransferController::class, 'show'])->name('transfer.show');
});

// MANAGER ROUTES
Route::prefix('manager')
    ->name('manager.')
    ->group(function () {
        Route::get('/dashboard', [ManagerDashboardController::class, 'index'])->name('dashboard');
});

// ==========================================
// GENERAL AUTHENTICATED ROUTES
// ==========================================
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // API - Product search
    Route::get('/api/products/search', function (\Illuminate\Http\Request $request) {
        $q = $request->input('q');
        return \App\Models\Product::where('name', 'like', "%{$q}%")
            ->orWhere('sku', 'like', "%{$q}%")
            ->limit(20)
            ->get(['id', 'name', 'sku']);
    });
});

require __DIR__ . '/auth.php';
