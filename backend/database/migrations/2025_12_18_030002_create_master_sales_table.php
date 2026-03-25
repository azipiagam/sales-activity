<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('master_sales', function (Blueprint $table) {
            $table->string('internal_id')->primary();
            $table->string('name')->nullable();
            $table->string('job_title')->nullable();
            $table->integer('class')->nullable();
            $table->string('department')->nullable();
            $table->integer('location')->nullable();
            $table->string('email')->nullable();
            $table->dateTime('last_modified')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_sales');
    }
};
