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

        $this->assertDatabaseCount('users', 0);
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
