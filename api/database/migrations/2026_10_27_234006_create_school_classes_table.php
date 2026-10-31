<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->foreignId('head_teacher_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->string('name');
            $table->string('level');
            $table->unsignedSmallInteger('capacity')->default(35);
            $table->string('room')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['academic_year_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_classes');
    }
};
