<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Verrouillage d'une période de notation après délibération :
 * locked_at renseignée = notes impossibles à créer, modifier ou supprimer.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('terms', function (Blueprint $table): void {
            $table->timestamp('locked_at')->nullable()->after('is_current');
        });
    }

    public function down(): void
    {
        Schema::table('terms', function (Blueprint $table): void {
            $table->dropColumn('locked_at');
        });
    }
};
