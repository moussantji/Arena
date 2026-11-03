<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiSmokeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $accounts = [
            ['direction@exemple.test', 'Aïssata Traoré', User::ROLE_DIRECTION],
            ['secretariat@exemple.test', 'Aminata Barry', User::ROLE_SECRETARIAT],
            ['comptable@exemple.test', 'Oumar Sy', User::ROLE_COMPTABLE],
            ['enseignant@exemple.test', 'Moussa Martior', User::ROLE_ENSEIGNANT],
        ];

        foreach ($accounts as [$email, $name, $role]) {
            User::factory()->create([
                'email' => $email,
                'name' => $name,
                'role' => $role,
                'password' => 'password',
            ]);
        }
    }

    public function test_health_endpoint_is_accessible()
    {
        $this->get('/api/health')->assertStatus(200);
    }

    public function test_login_endpoint_is_accessible()
    {
        $response = $this->postJson('/api/login', [
            'email' => 'direction@exemple.test',
            'password' => 'password',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['token', 'user']);
        $response->assertJsonPath('user.role', User::ROLE_DIRECTION);
    }

    public function test_login_rejects_invalid_credentials()
    {
        $this->postJson('/api/login', [
            'email' => 'direction@exemple.test',
            'password' => 'incorrect',
        ])->assertStatus(422);
    }

    public function test_unauthenticated_routes_are_protected()
    {
        $routes = [
            '/api/me',
            '/api/meta',
            '/api/students',
            '/api/classes',
            '/api/subjects',
            '/api/staff',
            '/api/invoices',
            '/api/notifications',
        ];

        foreach ($routes as $route) {
            $this->getJson($route)->assertStatus(401);
        }
    }

    public function test_direction_user_can_access_all_routes()
    {
        $token = $this->tokenFor('direction@exemple.test');

        foreach (['/api/meta', '/api/users', '/api/invoices', '/api/admissions'] as $route) {
            $this->withToken($token)->getJson($route)->assertStatus(200);
        }
    }

    public function test_secretariat_user_can_access_limited_routes()
    {
        $token = $this->tokenFor('secretariat@exemple.test');

        $this->withToken($token)->getJson('/api/meta')->assertStatus(200);
        $this->withToken($token)->getJson('/api/students')->assertStatus(200);
        $this->withToken($token)->getJson('/api/admissions')->assertStatus(200);

        $this->withToken($token)->getJson('/api/users')->assertStatus(403);
        $this->withToken($token)->getJson('/api/invoices')->assertStatus(403);
    }

    public function test_comptable_user_can_access_finance_routes()
    {
        $token = $this->tokenFor('comptable@exemple.test');

        $this->withToken($token)->getJson('/api/meta')->assertStatus(200);
        $this->withToken($token)->getJson('/api/invoices')->assertStatus(200);
        $this->withToken($token)->getJson('/api/finance/summary')->assertStatus(200);

        $this->withToken($token)->getJson('/api/admissions')->assertStatus(403);
        $this->withToken($token)->postJson('/api/students', [])->assertStatus(403);
    }

    public function test_enseignant_user_can_access_pedagogical_routes()
    {
        $token = $this->tokenFor('enseignant@exemple.test');

        $this->withToken($token)->getJson('/api/meta')->assertStatus(200);
        $this->withToken($token)->getJson('/api/grades')->assertStatus(200);

        $this->withToken($token)->getJson('/api/invoices')->assertStatus(403);
        $this->withToken($token)->getJson('/api/admissions')->assertStatus(403);
        $this->withToken($token)->postJson('/api/students', [])->assertStatus(403);
    }

    public function test_logout_revokes_the_current_token()
    {
        $token = $this->tokenFor('direction@exemple.test');

        $this->withToken($token)->postJson('/api/logout')->assertStatus(200);
        $this->app['auth']->forgetGuards();

        $this->withToken($token)->getJson('/api/me')->assertStatus(401);
    }

    public function test_direction_can_manage_user_accounts()
    {
        $token = $this->tokenFor('direction@exemple.test');

        $created = $this->withToken($token)->postJson('/api/users', [
            'name' => 'Nouveau Compte',
            'email' => 'nouveau@exemple.test',
            'password' => 'password123',
            'role' => User::ROLE_COMPTABLE,
        ]);
        $created->assertStatus(201);
        $userId = $created->json('user.id');

        $this->withToken($token)->patchJson("/api/users/{$userId}", [
            'role' => User::ROLE_SECRETARIAT,
        ])->assertStatus(200)->assertJsonPath('user.role', User::ROLE_SECRETARIAT);

        $this->withToken($token)->deleteJson("/api/users/{$userId}")->assertStatus(204);
        $this->assertDatabaseMissing('users', ['id' => $userId]);
    }

    public function test_non_direction_users_cannot_manage_accounts()
    {
        $token = $this->tokenFor('secretariat@exemple.test');

        $this->withToken($token)->getJson('/api/users')->assertStatus(403);
        $this->withToken($token)->postJson('/api/users', [
            'name' => 'Intrus',
            'email' => 'intrus@exemple.test',
            'password' => 'password123',
            'role' => User::ROLE_ENSEIGNANT,
        ])->assertStatus(403);
    }

    public function test_direction_cannot_delete_or_demote_the_last_direction_account()
    {
        $direction = User::where('email', 'direction@exemple.test')->firstOrFail();
        $token = $direction->createToken('test')->plainTextToken;

        $this->withToken($token)->deleteJson("/api/users/{$direction->id}")->assertStatus(422);
        $this->withToken($token)->patchJson("/api/users/{$direction->id}", [
            'role' => User::ROLE_ENSEIGNANT,
        ])->assertStatus(422);

        $this->assertDatabaseHas('users', [
            'id' => $direction->id,
            'role' => User::ROLE_DIRECTION,
        ]);
    }

    private function tokenFor(string $email): string
    {
        return User::where('email', $email)->firstOrFail()->createToken('test')->plainTextToken;
    }
}
