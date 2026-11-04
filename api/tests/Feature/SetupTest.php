<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SetupTest extends TestCase
{
    use RefreshDatabase;

    public function test_status_requests_setup_on_an_empty_database(): void
    {
        // Sans identifiants Google configurés (ils existent dans le .env local).
        config()->set('services.google.client_id', null);
        config()->set('services.google.client_secret', null);

        $this->getJson('/api/setup/status')
            ->assertOk()
            ->assertJsonPath('needs_setup', true)
            ->assertJsonPath('google_enabled', false);
    }

    public function test_setup_creates_the_school_year_terms_and_direction_account(): void
    {
        $response = $this->postJson('/api/setup', $this->payload());

        $response->assertCreated()
            ->assertJsonStructure(['token', 'user', 'school', 'academic_year'])
            ->assertJsonPath('user.role', User::ROLE_DIRECTION)
            ->assertJsonPath('school.name', 'Kalanso');

        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseHas('users', [
            'email' => 'direction@exemple.test',
            'role' => User::ROLE_DIRECTION,
        ]);
        $this->assertDatabaseHas('schools', [
            'name' => 'Kalanso',
            'full_name' => 'École Kalanso',
            'currency' => 'FCFA',
        ]);
        $this->assertDatabaseCount('academic_years', 1);
        $this->assertDatabaseCount('terms', 3);
        $this->assertDatabaseHas('terms', [
            'name' => 'Trimestre 1',
            'is_current' => true,
        ]);

        $this->getJson('/api/setup/status')
            ->assertOk()
            ->assertJsonPath('needs_setup', false);
    }

    public function test_setup_is_closed_after_the_first_account(): void
    {
        $this->postJson('/api/setup', $this->payload())->assertCreated();

        $this->postJson('/api/setup', $this->payload([
            'email' => 'autre@exemple.test',
        ]))->assertForbidden();
    }

    public function test_setup_is_closed_when_an_account_already_exists(): void
    {
        User::factory()->create();

        $this->getJson('/api/setup/status')
            ->assertOk()
            ->assertJsonPath('needs_setup', false);

        $this->postJson('/api/setup', $this->payload())->assertForbidden();
    }

    public function test_setup_validates_passwords_and_dates(): void
    {
        $this->postJson('/api/setup', $this->payload([
            'password' => 'court',
            'password_confirmation' => 'différent',
            'year_ends_on' => '2026-01-01',
        ]))->assertStatus(422)
            ->assertJsonValidationErrors(['password', 'year_ends_on']);
    }

    public function test_the_created_direction_account_can_log_in(): void
    {
        $this->postJson('/api/setup', $this->payload())->assertCreated();

        $this->postJson('/api/login', [
            'email' => 'direction@exemple.test',
            'password' => 'motdepasse123',
        ])->assertOk()
            ->assertJsonStructure(['token', 'user'])
            ->assertJsonPath('user.role', User::ROLE_DIRECTION);
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
