<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->enum('method', ['cash', 'mobile_money', 'bank', 'card', 'other'])->default('cash');
            $table->date('paid_on');
            $table->string('reference')->nullable();
            $table->enum('status', ['completed', 'pending', 'failed'])->default('completed');
            $table->string('receipt_path')->nullable();
            $table->timestamps();
            $table->index(['status', 'paid_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
