<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Socle de sécurité : journalisation des connexions, révocation des
 * sessions après changement de mot de passe et exigence minimale sur
 * la longueur des mots de passe.
 */
class SecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_failed_login_is_written_to_the_audit_log(): void
    {
        $user = $this->createDirection();

        // Mauvais mot de passe pour un compte existant : journalisé
        // avec l'identifiant du compte ciblé.
        $this->postJson('/api/login', [
            'email' => 'direction@exemple.test',
            'password' => 'mauvais-mot-de-passe',
        ])->assertStatus(422);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'auth.login_failed',
            'user_id' => $user->id,
        ]);

        // Adresse inconnue : journalisé également, sans utilisateur connu.
        $this->postJson('/api/login', [
            'email' => 'personne@exemple.test',
            'password' => 'mauvais-mot-de-passe',
        ])->assertStatus(422);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'auth.login_failed',
            'user_id' => null,
        ]);
    }

    public function test_successful_login_is_written_to_the_audit_log(): void
    {
        $user = $this->createDirection();

        $this->postJson('/api/login', [
            'email' => 'direction@exemple.test',
            'password' => 'motdepasse123',
        ])->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'auth.login',
            'user_id' => $user->id,
        ]);
    }

    public function test_password_change_revokes_existing_sessions(): void
    {
        $user = $this->createDirection();
        $token = $user->createToken('desktop')->plainTextToken;

        $other = User::create([
            'name' => 'Autre Direction',
            'email' => 'autre@exemple.test',
            'password' => 'motdepasse456',
            'role' => User::ROLE_DIRECTION,
        ]);
        $otherToken = $other->createToken('test')->plainTextToken;

        // La direction réinitialise le mot de passe du compte.
        $this->withToken($otherToken)->putJson("/api/users/{$user->id}", [
            'password' => 'nouveaumdp789',
        ])->assertOk();

        // Les jetons du compte modifié sont supprimés (révoqué côté serveur).
        // NB : pas de contrôle via /api/me ici — dans les tests, l'application
        // est réutilisée entre les requêtes et le garde Sanctum conserve en
        // cache le premier utilisateur résolu. En production, chaque requête
        // repart d'un état vierge et l'ancienne session est bien invalide.
        $this->assertSame(0, $user->tokens()->count());
        $this->assertNull(\Laravel\Sanctum\PersonalAccessToken::findToken($token));
    }

    public function test_password_must_be_at_least_10_characters(): void
    {
        // Première configuration : mot de passe trop court refusé.
        $this->postJson('/api/setup', $this->payload([
            'password' => 'neuf12345',
            'password_confirmation' => 'neuf12345',
        ]))->assertStatus(422)->assertJsonValidationErrors(['password']);

        // Création de compte par la direction : même exigence.
        $this->postJson('/api/setup', $this->payload())->assertCreated();

        $response = $this->postJson('/api/login', [
            'email' => 'direction@exemple.test',
            'password' => 'motdepasse123',
        ])->assertOk();
        $token = (string) $response->json('token');

        $this->withToken($token)->postJson('/api/users', [
            'name' => 'Compte Neuf',
            'email' => 'compte-neuf@exemple.test',
            'password' => 'neuf12345',
            'role' => User::ROLE_SECRETARIAT,
        ])->assertStatus(422)->assertJsonValidationErrors(['password']);
    }

    private function createDirection(): User
    {
        return User::create([
            'name' => 'Aïssata Traoré',
            'email' => 'direction@exemple.test',
            'password' => 'motdepasse123',
            'role' => User::ROLE_DIRECTION,
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'school_name' => 'Kalanso',
            'school_full_name' => 'École Kalanso',
            'school_email' => 'contact@exemple.test',
            'school_phone' => '+223 70 00 00 00',
            'school_address' => 'Bamako',
            'currency' => 'FCFA',
            'year_label' => '2026 — 2027',
            'year_starts_on' => '2026-09-01',
            'year_ends_on' => '2027-06-30',
            'name' => 'Aïssata Traoré',
            'email' => 'direction@exemple.test',
            'password' => 'motdepasse123',
            'password_confirmation' => 'motdepasse123',
        ], $overrides);
    }
}
