<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        if (Schema::hasTable('transfers')) {
            DB::statement("ALTER TABLE transfers MODIFY status ENUM('pending','in_transit','received','cancelled') NOT NULL DEFAULT 'pending'");
        }
    }

    public function down()
    {
        // no rollback alterations
    }
};
