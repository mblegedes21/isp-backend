<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // ensure status enum exists with required values
        if (Schema::hasTable('projects')) {
            // modify existing column if necessary
            DB::statement("ALTER TABLE projects MODIFY status ENUM('pending','active','returning','closed') NOT NULL DEFAULT 'pending'");
        }
    }

    public function down()
    {
        // do nothing on rollback to avoid losing data
    }
};
