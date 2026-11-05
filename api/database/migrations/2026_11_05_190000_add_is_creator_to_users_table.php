<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Ajoute le drapeau « créateur » aux comptes.
 *
 * Le créateur de l'établissement (le premier compte créé — via la
 * configuration initiale ou la première connexion Google) est celui qui
 * peut modifier le « Serveur de données » dans les Paramètres. Tous les
 * autres comptes sont marqués false et l'option leur est masquée.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_creator')->default(false)->after('role');
        });

        // Migration de l'existant : le premier compte créé devient
        // le créateur de l'établissement.
        $firstId = DB::table('users')->min('id');
        if ($firstId !== null) {
            DB::table('users')->where('id', $firstId)->update(['is_creator' => true]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_creator');
        });
    }
};
