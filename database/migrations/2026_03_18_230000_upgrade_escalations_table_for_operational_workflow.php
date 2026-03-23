<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('escalations')) {
            return;
        }

        Schema::table('escalations', function (Blueprint $table) {
            if (!Schema::hasColumn('escalations', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('ticket_id')->constrained('users')->nullOnDelete();
            }

            if (!Schema::hasColumn('escalations', 'role')) {
                $table->string('role', 20)->nullable()->after('created_by');
            }

            if (!Schema::hasColumn('escalations', 'type')) {
                $table->string('type', 50)->nullable()->after('role');
            }

            if (!Schema::hasColumn('escalations', 'severity')) {
                $table->string('severity', 20)->nullable()->after('type');
            }

            if (!Schema::hasColumn('escalations', 'impact')) {
                $table->string('impact', 30)->nullable()->after('severity');
            }

            if (!Schema::hasColumn('escalations', 'requires_immediate_action')) {
                $table->boolean('requires_immediate_action')->default(false)->after('impact');
            }

            if (!Schema::hasColumn('escalations', 'description')) {
                $table->text('description')->nullable()->after('requires_immediate_action');
            }

            if (!Schema::hasColumn('escalations', 'status')) {
                $table->string('status', 20)->default('pending')->after('description');
            }

            if (!Schema::hasColumn('escalations', 'ticket_status_before')) {
                $table->string('ticket_status_before', 40)->nullable()->after('status');
            }

            if (!Schema::hasColumn('escalations', 'handled_by')) {
                $table->foreignId('handled_by')->nullable()->after('ticket_status_before')->constrained('users')->nullOnDelete();
            }

            if (!Schema::hasColumn('escalations', 'handled_at')) {
                $table->timestamp('handled_at')->nullable()->after('handled_by');
            }

            if (!Schema::hasColumn('escalations', 'updated_at')) {
                $table->timestamp('updated_at')->nullable()->after('created_at');
            }
        });

        DB::table('escalations')
            ->orderBy('id')
            ->get()
            ->each(function ($row) {
                $type = $row->type ?: match ($row->reason ?? null) {
                    'FIBER_BACKBONE_DOWN' => 'technical_blocker',
                    'OLT_FAILURE' => 'technical_blocker',
                    'VENDOR_REQUIRED' => 'external_blocker',
                    'DIGGING_PERMISSION' => 'permit_issue',
                    'CUSTOMER_VIP' => 'operational_issue',
                    default => 'technical_blocker',
                };

                $description = $row->description ?: $row->note ?: $row->reason ?: 'Escalation membutuhkan tindak lanjut manager.';
                $createdBy = $row->created_by ?: $row->escalated_by ?: null;
                $status = $row->status ?: 'pending';

                DB::table('escalations')
                    ->where('id', $row->id)
                    ->update([
                        'created_by' => $createdBy,
                        'role' => $row->role ?: 'noc',
                        'type' => $type,
                        'severity' => $row->severity ?: 'medium',
                        'impact' => $row->impact ?: 'single_user',
                        'requires_immediate_action' => (bool) ($row->requires_immediate_action ?? false),
                        'description' => $description,
                        'status' => $status,
                        'ticket_status_before' => $row->ticket_status_before ?: 'IN_PROGRESS',
                        'reason' => $row->reason ?: strtoupper($type),
                        'note' => $row->note ?: $description,
                        'escalated_by' => $row->escalated_by ?: $createdBy,
                    ]);
            });
    }

    public function down(): void
    {
        if (!Schema::hasTable('escalations')) {
            return;
        }

        Schema::table('escalations', function (Blueprint $table) {
            if (Schema::hasColumn('escalations', 'handled_at')) {
                $table->dropColumn('handled_at');
            }

            if (Schema::hasColumn('escalations', 'handled_by')) {
                $table->dropConstrainedForeignId('handled_by');
            }

            if (Schema::hasColumn('escalations', 'ticket_status_before')) {
                $table->dropColumn('ticket_status_before');
            }

            if (Schema::hasColumn('escalations', 'status')) {
                $table->dropColumn('status');
            }

            if (Schema::hasColumn('escalations', 'description')) {
                $table->dropColumn('description');
            }

            if (Schema::hasColumn('escalations', 'requires_immediate_action')) {
                $table->dropColumn('requires_immediate_action');
            }

            if (Schema::hasColumn('escalations', 'impact')) {
                $table->dropColumn('impact');
            }

            if (Schema::hasColumn('escalations', 'severity')) {
                $table->dropColumn('severity');
            }

            if (Schema::hasColumn('escalations', 'type')) {
                $table->dropColumn('type');
            }

            if (Schema::hasColumn('escalations', 'role')) {
                $table->dropColumn('role');
            }

            if (Schema::hasColumn('escalations', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }
        });
    }
};
