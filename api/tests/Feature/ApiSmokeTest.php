<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiSmokeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_health_and_meta_endpoints(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertJsonPath('status', 'ok');

        $this->getJson('/api/meta')
            ->assertOk()
            ->assertJsonStructure([
                'school',
                'academic_year',
                'term',
                'terms',
                'classes',
                'subjects',
                'departments',
                'fee_types',
                'counts',
                'options',
            ]);
    }

    public function test_catalog_endpoints_return_seeded_data(): void
    {
        $this->getJson('/api/school')->assertOk()->assertJsonStructure(['school']);
        $this->getJson('/api/classes')->assertOk()->assertJsonStructure(['classes']);
        $this->getJson('/api/subjects')->assertOk()->assertJsonStructure(['subjects']);
        $this->getJson('/api/staff')->assertOk()->assertJsonStructure(['staff']);
        $this->getJson('/api/timetable')->assertOk()->assertJsonStructure(['slots']);
        $this->getJson('/api/admissions')->assertOk()->assertJsonStructure(['data', 'current_page', 'last_page']);
        $this->getJson('/api/admissions/stats')->assertOk()->assertJsonStructure(['total', 'columns']);
        $this->getJson('/api/threads')->assertOk()->assertJsonStructure(['threads']);
        $this->getJson('/api/notifications')->assertOk()->assertJsonStructure(['data']);
        $this->getJson('/api/documents')->assertOk()->assertJsonStructure(['data']);
    }

    public function test_students_are_paginated_filterable_and_searchable(): void
    {
        $classes = $this->getJson('/api/classes')->json('classes');
        $classId = $classes[0]['id'];

        $response = $this->getJson("/api/students?class_id={$classId}&per_page=5");
        $response->assertOk()->assertJsonStructure([
            'data',
            'current_page',
            'last_page',
            'per_page',
            'total',
        ]);
        $this->assertLessThanOrEqual(5, count($response->json('data')));
        $this->assertGreaterThan(0, $response->json('total'));
        foreach ($response->json('data') as $student) {
            $this->assertSame($classId, $student['school_class']['id']);
        }

        $search = $this->getJson('/api/students?q=Aminata&per_page=10');
        $search->assertOk();
        $this->assertGreaterThan(0, $search->json('total'));
    }

    public function test_student_detail_and_report_card(): void
    {
        $student = $this->getJson('/api/students?per_page=1')->json('data.0');

        $this->getJson("/api/students/{$student['id']}")
            ->assertOk()
            ->assertJsonPath('student.id', $student['id'])
            ->assertJsonStructure(['student', 'summary']);

        $this->getJson("/api/students/{$student['id']}/report-card")
            ->assertOk()
            ->assertJsonStructure([
                'student',
                'term',
                'subjects',
                'general_average',
                'total_coefficients',
                'rank',
                'class_size',
                'mention',
            ]);
    }

    public function test_grades_absences_finance_and_payments_lists(): void
    {
        $grades = $this->getJson('/api/grades?per_page=10');
        $grades->assertOk()->assertJsonStructure(['data', 'stats', 'latest_exam']);

        $latest = $this->getJson('/api/grades?latest_exam=1&per_page=10')->assertOk();
        $this->assertNotNull($latest->json('latest_exam'));
        $latestDate = $latest->json('latest_exam.date');
        $this->assertNotEmpty($latestDate);
        foreach ($latest->json('data') as $grade) {
            $this->assertSame($latestDate, substr($grade['evaluated_on'], 0, 10));
        }

        $this->getJson('/api/absences?per_page=10')
            ->assertOk()
            ->assertJsonStructure(['data', 'stats']);

        $this->getJson('/api/invoices?per_page=10')
            ->assertOk()
            ->assertJsonStructure(['data', 'current_page', 'last_page', 'total']);

        $this->getJson('/api/payments?per_page=10')
            ->assertOk()
            ->assertJsonStructure(['data', 'current_page', 'last_page', 'total']);
    }

    public function test_demo_login_returns_a_working_token(): void
    {
        $login = $this->postJson('/api/login', [
            'email' => 'direction@diallo.test',
            'password' => 'password',
            'device_name' => 'phpunit',
        ]);

        $login->assertOk()->assertJsonStructure(['token', 'user']);
        $token = $login->json('token');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'direction@diallo.test');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/notifications/read-all')
            ->assertOk();
    }

    public function test_writes_require_authentication(): void
    {
        $this->postJson('/api/notifications/read-all')->assertUnauthorized();
        $this->postJson('/api/subjects', ['name' => 'Test'])->assertUnauthorized();
    }
}
