<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_class_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('term_id')->constrained()->cascadeOnDelete();
            $table->enum('evaluation', ['devoir_1', 'devoir_2', 'composition']);
            $table->decimal('score', 5, 2);
            $table->decimal('max_score', 5, 2)->default(20);
            $table->decimal('coefficient', 3, 2)->default(1);
            $table->date('evaluated_on');
            $table->string('comment')->nullable();
            $table->timestamps();
            $table->unique(['student_id', 'subject_id', 'term_id', 'evaluation'], 'grade_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};
