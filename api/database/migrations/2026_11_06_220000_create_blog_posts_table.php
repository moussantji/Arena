<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blog_posts', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 180)->unique();
            $table->string('title', 220);
            $table->string('category', 80)->default('Vie académique');
            $table->string('author', 120)->default('Institut Bernard Kouchner');
            $table->text('summary');
            $table->longText('body'); // JSON : tableau de paragraphes
            $table->unsignedSmallInteger('reading_time')->default(3);
            $table->boolean('is_featured')->default(false);
            $table->timestamp('published_at')->nullable();

            $table->timestamps();
            $table->index('published_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_posts');
    }
};
