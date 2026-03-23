<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('technician_location_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('technician_location_logs', 'needs_review')) {
                $table->boolean('needs_review')->default(false)->after('location_status');
                $table->index(['needs_review', 'location_status', 'created_at'], 'loc_logs_review_status_created_idx');
            }
        });

        Schema::table('ticket_progress_photos', function (Blueprint $table) {
            if (!Schema::hasColumn('ticket_progress_photos', 'needs_review')) {
                $table->boolean('needs_review')->default(false)->after('location_status');
                $table->index(['needs_review', 'location_status', 'created_at'], 'ticket_photos_review_status_created_idx');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ticket_progress_photos', function (Blueprint $table) {
            if (Schema::hasColumn('ticket_progress_photos', 'needs_review')) {
                $table->dropIndex('ticket_photos_review_status_created_idx');
                $table->dropColumn('needs_review');
            }
        });

        Schema::table('technician_location_logs', function (Blueprint $table) {
            if (Schema::hasColumn('technician_location_logs', 'needs_review')) {
                $table->dropIndex('loc_logs_review_status_created_idx');
                $table->dropColumn('needs_review');
            }
        });
    }
};
