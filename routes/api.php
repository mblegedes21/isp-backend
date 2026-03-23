<?php

use App\Http\Controllers\Api\AppStateController;
use App\Http\Controllers\Api\AreaActionController;
use App\Http\Controllers\Api\AreaController;
use App\Http\Controllers\Api\AttendanceFlagController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AuditWorkflowController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\EscalationController;
use App\Http\Controllers\Api\IncidentController;
use App\Http\Controllers\Api\LeaderDashboardController;
use App\Http\Controllers\Api\LossReportController;
use App\Http\Controllers\Api\ManagerDashboardController;
use App\Http\Controllers\Api\MaterialCategoryController;
use App\Http\Controllers\Api\NetworkMonitoringController;
use App\Http\Controllers\Api\NocDashboardController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PurchaseRequestController;
use App\Http\Controllers\Api\StockIssueController;
use App\Http\Controllers\Api\StockAuditController;
use App\Http\Controllers\Api\StockReceiptController;
use App\Http\Controllers\Api\StockTransactionController;
use App\Http\Controllers\Api\StockTransferController;
use App\Http\Controllers\Api\TechnicianLocationController;
use App\Http\Controllers\Api\TechnicianIncentiveController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\TicketEvidenceController;
use App\Http\Controllers\Api\TicketMaterialReportController;
use App\Http\Controllers\Api\TicketMaterialRequestController;
use App\Http\Controllers\Api\TicketMaterialRemainingController;
use App\Http\Controllers\Api\TicketProgressPhotoController;
use App\Http\Controllers\Api\TicketWorkflowController;
use App\Http\Controllers\Api\WarehouseDashboardController;
use App\Http\Controllers\Api\WarehouseTicketMaterialController;
use App\Http\Controllers\Api\WarehouseTransactionController;
use App\Models\LossReport;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::options('{any}', function () {
    return response()->json([], 200);
})->where('any', '.*');

Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);
Route::get('user', function (Request $request) {
    return response()->json($request->user());
})->middleware('auth:sanctum');
Route::get('dashboard', function () {
    return response()->json([
        'open_tickets' => Ticket::query()->whereIn('status', ['CREATED', 'NEW', 'OPEN', 'ASSIGNED', 'MATERIAL_PREPARED', 'IN_PROGRESS'])->count(),
        'resolved_tickets' => Ticket::query()->where('status', 'COMPLETED')->count(),
        'escalated_tickets' => Ticket::query()->where('status', 'ESCALATED')->count(),
        'loss_reports' => LossReport::query()->count(),
    ]);
});

Route::post('auth/register', [AuthController::class, 'register']);
Route::post('auth/login', [AuthController::class, 'login']);
Route::get('branches', [BranchController::class, 'index']);

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::get('app-state', AppStateController::class);
    Route::get('customers', [CustomerController::class, 'index']);
    Route::post('customers', [CustomerController::class, 'store']);
    Route::put('customers/{id}', [CustomerController::class, 'update']);
    Route::delete('customers/{id}', [CustomerController::class, 'destroy']);
    Route::get('mitra/dashboard', [CustomerController::class, 'dashboard'])->middleware('role:MITRA');
    Route::get('manager/mitra/summary', [CustomerController::class, 'managerSummary'])->middleware('role:MANAGER');
    Route::get('manager/mitra', [CustomerController::class, 'managerIndex'])->middleware('role:MANAGER');
    Route::get('manager/mitra/{id}', [CustomerController::class, 'managerShow'])->middleware('role:MANAGER');
    Route::get('technician/materials', [TicketMaterialReportController::class, 'assignedMaterials'])->middleware('role:TEKNISI');
    Route::get('teknisi/materials', [TicketMaterialReportController::class, 'assignedMaterials'])->middleware('role:TEKNISI');
    Route::post('branches', [BranchController::class, 'store'])->middleware('role:MANAGER');
    Route::put('branches/{branch}', [BranchController::class, 'update'])->middleware('role:MANAGER');
    Route::delete('branches/{branch}', [BranchController::class, 'destroy'])->middleware('role:MANAGER');
    Route::apiResource('areas', AreaController::class);
    Route::apiResource('materials', ProductController::class)->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::get('material-categories', [MaterialCategoryController::class, 'index'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::apiResource('tickets', TicketController::class)->except(['destroy']);
    Route::post('tickets/{ticket}/assign', [TicketWorkflowController::class, 'assign'])->middleware('role:LEADER,MANAGER,NOC');
    Route::post('tickets/{ticket}/transition', [TicketWorkflowController::class, 'transition'])->middleware('role:TEKNISI,LEADER,MANAGER,NOC');
    Route::post('tickets/{ticket}/support-team', [TicketWorkflowController::class, 'supportTeam'])->middleware('role:LEADER,MANAGER,NOC');
    Route::post('tickets/{ticket}/review-completion', [TicketWorkflowController::class, 'reviewCompletion'])->middleware('role:LEADER,MANAGER');
    Route::get('tickets/material-requests', [TicketMaterialRequestController::class, 'index'])->middleware('role:LEADER,MANAGER,TEKNISI,ADMIN_GUDANG');
    Route::get('material-requests', [TicketMaterialRequestController::class, 'index'])->middleware('role:LEADER,MANAGER,TEKNISI,ADMIN_GUDANG');
    Route::get('tickets/{ticket}/materials', [TicketMaterialRequestController::class, 'ticketMaterials'])->middleware('role:LEADER,MANAGER,TEKNISI,ADMIN_GUDANG');
    Route::post('tickets/{ticket}/materials/request', [TicketMaterialRequestController::class, 'store'])->middleware('role:TEKNISI');
    Route::post('material-requests', [TicketMaterialRequestController::class, 'storeDirect'])->middleware('role:TEKNISI');
    Route::post('ticket-materials', [TicketWorkflowController::class, 'storeMaterials'])->middleware('role:LEADER,MANAGER,NOC');
    Route::post('tickets/{ticket}/images', [TicketEvidenceController::class, 'store'])->middleware(['role:TEKNISI,LEADER,MANAGER,ADMIN_GUDANG,NOC', 'throttle:evidence-uploads']);
    Route::post('tickets/progress-photos', [TicketProgressPhotoController::class, 'store'])->middleware(['role:TEKNISI,LEADER,MANAGER,NOC', 'throttle:evidence-uploads']);
    Route::post('tickets/material-remaining', [TicketMaterialRemainingController::class, 'store'])->middleware(['role:TEKNISI,LEADER,MANAGER,NOC', 'throttle:evidence-uploads']);
    Route::post('tickets/material-report', [TicketMaterialReportController::class, 'store'])->middleware('role:TEKNISI,LEADER,MANAGER,ADMIN_GUDANG,NOC');
    Route::post('technician-locations', [TechnicianLocationController::class, 'store'])->middleware('role:TEKNISI,LEADER,MANAGER,NOC');
    Route::get('technician/summary', [TechnicianIncentiveController::class, 'summary'])->middleware('role:TEKNISI');
    Route::get('technician/history', [TechnicianIncentiveController::class, 'history'])->middleware('role:TEKNISI');

    Route::get('escalations', [EscalationController::class, 'list'])->middleware('role:NOC,LEADER,MANAGER');
    Route::patch('escalations/{escalation}', [EscalationController::class, 'update'])->middleware('role:MANAGER');
    Route::get('tickets/{ticket}/escalations', [EscalationController::class, 'index'])->middleware('role:NOC,LEADER,MANAGER');
    Route::post('tickets/{ticket}/escalations', [EscalationController::class, 'store'])->middleware('role:NOC,LEADER');

    Route::get('attendance', [AttendanceController::class, 'index'])->middleware('role:LEADER,MANAGER');
    Route::post('attendance/check-in', [AttendanceController::class, 'checkIn'])->middleware('role:TEKNISI,LEADER,MANAGER,ADMIN_GUDANG,NOC');
    Route::post('attendance/check-out', [AttendanceController::class, 'checkOut'])->middleware('role:TEKNISI,LEADER,MANAGER,ADMIN_GUDANG,NOC');
    Route::post('attendance-flags/{attendanceFlag}/status', [AttendanceFlagController::class, 'updateStatus'])->middleware('role:LEADER,MANAGER');

    Route::apiResource('stock-transactions', StockTransactionController::class)->only(['index', 'store']);
    Route::get('stock-receipts', [StockReceiptController::class, 'index'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::post('stock-receipts', [StockReceiptController::class, 'store'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::post('stock-in', [StockReceiptController::class, 'store'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::get('stock-issues', [StockIssueController::class, 'index'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::post('stock-issues', [StockIssueController::class, 'store'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::post('stock-out', [StockIssueController::class, 'store'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::get('stock-transfers', [StockTransferController::class, 'index'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::post('stock-transfers', [StockTransferController::class, 'store'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::post('stock-transfers/{stockTransfer}/approve', [StockTransferController::class, 'approve'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::get('purchase-requests', [PurchaseRequestController::class, 'index'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::post('purchase-requests', [PurchaseRequestController::class, 'store'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::post('purchase-requests/{purchaseRequest}/approve', [PurchaseRequestController::class, 'approve'])->middleware('role:MANAGER');
    Route::post('purchase-requests/{purchaseRequest}/reject', [PurchaseRequestController::class, 'reject'])->middleware('role:MANAGER');
    Route::put('purchase-requests/{purchaseRequest}/approve', [PurchaseRequestController::class, 'approve'])->middleware('role:MANAGER');
    Route::put('purchase-requests/{purchaseRequest}/reject', [PurchaseRequestController::class, 'reject'])->middleware('role:MANAGER');
    Route::post('purchase-requests/{purchaseRequest}/resend', [PurchaseRequestController::class, 'resend'])->middleware('role:ADMIN_GUDANG');
    Route::get('stock-audits', [StockAuditController::class, 'index'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::post('stock-audits', [StockAuditController::class, 'store'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::post('stock-audits/{stockAudit}/approve', [StockAuditController::class, 'approve'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::post('stock-audits/{stockAudit}/reject', [StockAuditController::class, 'reject'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::post('stock-audits/{stockAudit}/loss-report', [StockAuditController::class, 'createLossReport'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::get('audit-stock', [StockAuditController::class, 'index'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::post('audit-stock', [StockAuditController::class, 'store'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::get('loss-reports', [LossReportController::class, 'index'])->middleware('role:ADMIN_GUDANG,MANAGER,LEADER');
    Route::post('loss-reports', [LossReportController::class, 'store'])->middleware('role:TEKNISI,LEADER,ADMIN_GUDANG,MANAGER');
    Route::post('loss-reports/{lossReport}/decision', [LossReportController::class, 'decide'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::get('audit-logs', [AuditWorkflowController::class, 'index'])->middleware('role:LEADER,MANAGER,ADMIN_GUDANG');
    Route::post('audit-logs', [AuditWorkflowController::class, 'store'])->middleware('role:LEADER,MANAGER');
    Route::post('audit-logs/{auditLog}/review', [AuditWorkflowController::class, 'updateReview'])->middleware('role:MANAGER');
    Route::post('incidents/{incident}/respond', [IncidentController::class, 'respond'])->middleware('role:MANAGER');
    Route::post('area-actions', [AreaActionController::class, 'store'])->middleware('role:MANAGER');

    Route::get('noc/dashboard', NocDashboardController::class)->middleware('role:NOC');
    Route::get('network/monitoring', NetworkMonitoringController::class)->middleware('role:NOC,LEADER,MANAGER');
    Route::get('manager/dashboard', ManagerDashboardController::class)->middleware('role:MANAGER');
    Route::get('leader/dashboard', LeaderDashboardController::class)->middleware('role:LEADER,MANAGER');
    Route::get('warehouse/dashboard', WarehouseDashboardController::class)->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::get('warehouse/transactions', [WarehouseTransactionController::class, 'index'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::post('warehouse/transactions', [WarehouseTransactionController::class, 'store'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::get('warehouse/ticket-material-requests', [WarehouseTicketMaterialController::class, 'index'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::post('material-requests/{id}/process', [WarehouseTicketMaterialController::class, 'processRequest'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::post('warehouse/tickets/{ticket}/release-materials', [WarehouseTicketMaterialController::class, 'releaseMaterials'])->middleware('role:ADMIN_GUDANG,MANAGER');
    Route::get('warehouse/tickets/{ticket}/material-release-report', [WarehouseTicketMaterialController::class, 'releaseReport'])->middleware('role:ADMIN_GUDANG,MANAGER,LEADER');
    Route::get('warehouse/tickets/{ticket}/return-checklist', [WarehouseTicketMaterialController::class, 'returnChecklist'])->middleware('role:ADMIN_GUDANG,MANAGER,LEADER,TEKNISI');
    Route::post('warehouse/tickets/{ticket}/return-materials', [WarehouseTicketMaterialController::class, 'processReturns'])->middleware('role:ADMIN_GUDANG,MANAGER');
});
