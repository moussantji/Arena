<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Restriction PC : l'application desktop est réservée aux rôles
 * d'administration. Les comptes enseignants (et, plus tard, parents)
 * se connecteront uniquement via l'application mobile Kalanso.
 */
class DesktopRestrictionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.google.client_id', 'client-test');
        config()->set('services.google.client_secret', 'secret-test');
    }

    public function test_enseignant_cannot_log_in_to_the_desktop_app(): void
    {
        $this->createUser('enseignant@exemple.test', User::ROLE_ENSEIGNANT);

        $response = $this->postJson('/api/login', [
            'email' => 'enseignant@exemple.test',
            'password' => 'motdepasse123',
            'device_name' => 'kalanso-desktop',
        ]);
        $response->assertStatus(403);
        $this->assertStringContainsString('mobile', (string) $response->json('message'));
    }

    public function test_enseignant_can_log_in_through_the_mobile_channel(): void
    {
        $this->createUser('enseignant@exemple.test', User::ROLE_ENSEIGNANT);

        $this->postJson('/api/login', [
            'email' => 'enseignant@exemple.test',
            'password' => 'motdepasse123',
            'device_name' => 'kalanso-mobile',
        ])->assertOk()
            ->assertJsonStructure(['token', 'user']);
    }

    public function test_staff_roles_can_log_in_to_the_desktop_app(): void
    {
        foreach ([User::ROLE_DIRECTION, User::ROLE_SECRETARIAT, User::ROLE_COMPTABLE] as $role) {
            $email = "{$role}@exemple.test";
            $this->createUser($email, $role);

            $this->postJson('/api/login', [
                'email' => $email,
                'password' => 'motdepasse123',
                'device_name' => 'kalanso-desktop',
            ])->assertOk();
        }
    }

    public function test_enseignant_google_login_is_rejected_on_the_desktop(): void
    {
        $this->createUser('enseignant@exemple.test', User::ROLE_ENSEIGNANT, googleId: 'google-enseignant');

        Http::fake([
            'https://oauth2.googleapis.com/*' => Http::response(['access_token' => 'google-access-token']),
            'https://openidconnect.googleapis.com/*' => Http::response([
                'sub' => 'google-enseignant',
                'email' => 'enseignant@exemple.test',
                'email_verified' => true,
                'name' => 'Moussa Martior',
            ]),
        ]);

        $response = $this->postJson('/api/auth/google/exchange', $this->googlePayload());
        $response->assertStatus(403);
        $this->assertStringContainsString('mobile', (string) $response->json('message'));
    }

    public function test_setup_marks_the_first_account_as_the_creator(): void
    {
        $this->postJson('/api/setup', $this->setupPayload())->assertCreated();

        $this->assertDatabaseHas('users', [
            'email' => 'direction@exemple.test',
            'is_creator' => true,
        ]);
    }

    public function test_accounts_created_by_the_direction_are_not_creators(): void
    {
        $this->postJson('/api/setup', $this->setupPayload())->assertCreated();
        $token = (string) $this->postJson('/api/login', [
            'email' => 'direction@exemple.test',
            'password' => 'motdepasse123',
            'device_name' => 'kalanso-desktop',
        ])->assertOk()->json('token');

        $this->withToken($token)->postJson('/api/users', [
            'name' => 'Nouveau Compte',
            'email' => 'nouveau@exemple.test',
            'password' => 'motdepasse456',
            'role' => User::ROLE_SECRETARIAT,
        ])->assertCreated();

        $this->assertDatabaseHas('users', [
            'email' => 'nouveau@exemple.test',
            'is_creator' => false,
        ]);
    }

    private function createUser(string $email, string $role, ?string $googleId = null): User
    {
        $user = User::create([
            'name' => 'Utilisateur Test',
            'email' => $email,
            'password' => 'motdepasse123',
            'role' => $role,
        ]);

        if ($googleId !== null) {
            $user->forceFill(['google_id' => $googleId])->save();
        }

        return $user;
    }

    /**
     * @return array<string, mixed>
     */
    private function googlePayload(): array
    {
        return [
            'code' => 'authorization-code',
            'code_verifier' => str_repeat('v', 64),
            'redirect_uri' => 'http://127.0.0.1:45871/oauth/callback',
            'state' => str_repeat('s', 43),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function setupPayload(): array
    {
        return [
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
        ];
    }
}
