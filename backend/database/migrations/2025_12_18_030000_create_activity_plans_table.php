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
        Schema::create('activity_plans', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('plan_no')->nullable();
            $table->string('sales_internal_id')->nullable()->index();
            $table->string('sales_name')->nullable();
            $table->string('customer_id')->nullable()->index();
            $table->string('customer_name')->nullable();
            $table->string('customer_address')->nullable();
            $table->date('plan_date')->nullable()->index();
            $table->string('tujuan')->nullable();
            $table->text('keterangan_tambahan')->nullable();
            $table->string('status')->nullable()->index();
            $table->string('user_photo')->nullable();
            $table->text('result')->nullable();
            $table->double('result_location_lat', 10, 8)->nullable();
            $table->double('result_location_lng', 11, 8)->nullable();
            $table->double('result_location_accuracy')->nullable();
            $table->double('customer_location_lat', 10, 8)->nullable();
            $table->double('customer_location_lng', 11, 8)->nullable();
            $table->integer('result_location_distance')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->bigInteger('result_location_timestamp')->nullable();
            $table->bigInteger('result_saved_at')->nullable();
            $table->bigInteger('created_at')->nullable();
            $table->bigInteger('updated_at')->nullable();
            $table->bigInteger('deleted_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_plans');
    }
};
