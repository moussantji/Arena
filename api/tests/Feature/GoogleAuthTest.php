<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.google.client_id', 'client-test');
        config()->set('services.google.client_secret', 'secret-test');
    }

    public function test_status_exposes_the_google_client_id_when_configured(): void
    {
        $this->getJson('/api/auth/google/status')
            ->assertOk()
            ->assertJsonPath('enabled', true)
            ->assertJsonPath('client_id', 'client-test');
    }

    public function test_first_google_login_creates_the_direction_account_and_defaults(): void
    {
        Http::fake([
            'https://oauth2.googleapis.com/*' => Http::response(['access_token' => 'google-access-token']),
            'https://openidconnect.googleapis.com/*' => Http::response([
                'sub' => 'google-premier',
                'email' => 'direction@exemple.test',
                'email_verified' => true,
                'name' => 'Aïssata Traoré',
            ]),
        ]);

        $this->postJson('/api/auth/google/exchange', $this->payload())
            ->assertOk()
            ->assertJsonPath('user.role', User::ROLE_DIRECTION)
            ->assertJsonPath('user.name', 'Aïssata Traoré')
            ->assertJsonPath('first_account', true);

        $this->assertDatabaseHas('users', [
            'email' => 'direction@exemple.test',
            'role' => User::ROLE_DIRECTION,
            'google_id' => 'google-premier',
        ]);
        $this->assertDatabaseCount('schools', 1);
        $this->assertDatabaseCount('academic_years', 1);
        $this->assertDatabaseCount('terms', 3);

        $this->getJson('/api/setup/status')
            ->assertOk()
            ->assertJsonPath('needs_setup', false);
    }

    public function test_first_google_login_defaults_the_school_name_to_be_edited(): void
    {
        Http::fake([
            'https://oauth2.googleapis.com/*' => Http::response(['access_token' => 'google-access-token']),
            'https://openidconnect.googleapis.com/*' => Http::response([
                'sub' => 'google-premier',
                'email' => 'direction@exemple.test',
                'email_verified' => true,
            ]),
        ]);

        $token = $this->postJson('/api/auth/google/exchange', $this->payload())
            ->assertOk()
            ->json('token');

        $this->withToken($token)->patchJson('/api/school', [
            'name' => 'École Kalanso',
            'full_name' => 'École Kalanso de Bamako',
        ])->assertOk()->assertJsonPath('school.name', 'École Kalanso');
    }

    public function test_existing_user_is_linked_and_receives_a_sanctum_token(): void
    {
        $user = User::factory()->create([
            'email' => 'direction@exemple.test',
            'role' => User::ROLE_DIRECTION,
        ]);

        Http::fake([
            'https://oauth2.googleapis.com/*' => Http::response([
                'access_token' => 'google-access-token',
            ]),
            'https://openidconnect.googleapis.com/*' => Http::response([
                'sub' => 'google-user-123',
                'email' => 'direction@exemple.test',
                'email_verified' => true,
            ]),
        ]);

        $this->postJson('/api/auth/google/exchange', $this->payload())
            ->assertOk()
            ->assertJsonStructure(['token', 'user'])
            ->assertJsonPath('user.role', User::ROLE_DIRECTION);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'google_id' => 'google-user-123',
        ]);

        Http::assertSent(fn ($request) => $request->url() === 'https://oauth2.googleapis.com/token'
            && $request['code_verifier'] === str_repeat('v', 64)
            && $request['redirect_uri'] === 'http://127.0.0.1:45871/oauth/callback');
    }

    public function test_unknown_google_email_does_not_create_an_account(): void
    {
        User::factory()->create(['email' => 'direction@exemple.test']);

        Http::fake([
            'https://oauth2.googleapis.com/*' => Http::response(['access_token' => 'token']),
            'https://openidconnect.googleapis.com/*' => Http::response([
                'sub' => 'google-inconnu',
                'email' => 'inconnu@exemple.test',
                'email_verified' => true,
            ]),
        ]);

        $this->postJson('/api/auth/google/exchange', $this->payload())
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);

        $this->assertDatabaseCount('users', 1);
    }

    public function test_unverified_google_email_is_rejected(): void
    {
        User::factory()->create(['email' => 'direction@exemple.test']);

        Http::fake([
            'https://oauth2.googleapis.com/*' => Http::response(['access_token' => 'token']),
            'https://openidconnect.googleapis.com/*' => Http::response([
                'sub' => 'google-user-123',
                'email' => 'direction@exemple.test',
                'email_verified' => false,
            ]),
        ]);

        $this->postJson('/api/auth/google/exchange', $this->payload())
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_google_login_is_rejected_when_not_configured(): void
    {
        config()->set('services.google.client_id', null);
        config()->set('services.google.client_secret', null);

        $this->getJson('/api/auth/google/status')
            ->assertOk()
            ->assertJsonPath('enabled', false);

        $this->postJson('/api/auth/google/exchange', $this->payload())
            ->assertStatus(422)
            ->assertJsonValidationErrors(['google']);
    }

    public function test_non_loopback_redirect_is_rejected(): void
    {
        $this->postJson('/api/auth/google/exchange', $this->payload([
            'redirect_uri' => 'https://example.com/oauth/callback',
        ]))->assertStatus(422)
            ->assertJsonValidationErrors(['redirect_uri']);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'code' => 'authorization-code',
            'code_verifier' => str_repeat('v', 64),
            'redirect_uri' => 'http://127.0.0.1:45871/oauth/callback',
            'state' => str_repeat('s', 43),
        ], $overrides);
    }
}
