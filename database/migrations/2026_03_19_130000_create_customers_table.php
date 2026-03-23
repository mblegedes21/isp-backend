<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mitra_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->string('nik', 32);
            $table->string('no_hp', 32);
            $table->text('alamat');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('package_name');
            $table->decimal('package_price', 14, 2);
            $table->decimal('ppn', 14, 2)->default(11.00);
            $table->decimal('bhp', 14, 2)->default(0.50);
            $table->decimal('uso', 14, 2)->default(1.50);
            $table->decimal('total_price', 14, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
