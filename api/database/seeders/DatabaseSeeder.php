<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * La base de Kalanso démarre volontairement vide.
     *
     * Le premier compte Direction, l'établissement, l'année scolaire et les
     * trimestres sont créés par le formulaire de première configuration
     * (POST /api/setup). Aucun compte ni aucune donnée de démonstration n'est
     * injecté par les seeders.
     */
    public function run(): void
    {
        //
    }
}
