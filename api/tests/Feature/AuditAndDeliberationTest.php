<?php

namespace Tests\Feature;

use App\Models\Grade;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Term;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditAndDeliberationTest extends TestCase
{
    use RefreshDatabase;

    public function test_grades_are_editable_until_the_period_is_deliberated(): void
    {
        [$token, $term] = $this->setupWorkspace();
        [$student, $subject] = $this->createStudentAndSubject();

        $gradePayload = [
            'student_id' => $student->id,
            'subject_id' => $subject->id,
            'term_id' => $term->id,
            'evaluation' => 'devoir_1',
            'score' => 15,
            'max_score' => 20,
            'evaluated_on' => '2026-11-05',
        ];

        // Période ouverte : la saisie fonctionne.
        $this->withToken($token)->postJson('/api/grades', $gradePayload)->assertCreated();

        // Délibération : la période se verrouille.
        $this->withToken($token)
            ->patchJson("/api/references/terms/{$term->id}/lock", ['locked' => true])
            ->assertOk();
        $this->assertNotNull($term->fresh()->locked_at);

        // Verrouillée : aucun écrit n'est possible, quel que soit le sens.
        $grade = Grade::query()->firstOrFail();
        $this->withToken($token)->postJson('/api/grades', $gradePayload)->assertForbidden()
            ->assertJsonPath('message', 'Cette période est délibérée et verrouillée : les notes ne peuvent plus être modifiées.');
        $this->withToken($token)->patchJson("/api/grades/{$grade->id}", ['score' => 18])->assertForbidden();
        $this->withToken($token)->deleteJson("/api/grades/{$grade->id}")->assertForbidden();

        // Réouverture : la saisie redevient possible (action journalisée).
        $this->withToken($token)
            ->patchJson("/api/references/terms/{$term->id}/lock", ['locked' => false])
            ->assertOk();
        $this->assertNull($term->fresh()->locked_at);
        $this->withToken($token)->patchJson("/api/grades/{$grade->id}", ['score' => 18])->assertOk();
    }

    public function test_sensitive_actions_are_written_to_the_audit_log(): void
    {
        [$token, $term] = $this->setupWorkspace();
        [$student, $subject] = $this->createStudentAndSubject();

        $this->withToken($token)->postJson('/api/grades', [
            'student_id' => $student->id,
            'subject_id' => $subject->id,
            'term_id' => $term->id,
            'evaluation' => 'devoir_1',
            'score' => 12,
            'max_score' => 20,
            'evaluated_on' => '2026-11-05',
        ])->assertCreated();

        $this->withToken($token)
            ->patchJson("/api/references/terms/{$term->id}/lock", ['locked' => true])
            ->assertOk();

        $this->assertDatabaseHas('audit_logs', ['action' => 'grade.created']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'term.locked']);

        $this->withToken($token)->getJson('/api/audit-logs?action=grade')
            ->assertOk()
            ->assertJsonPath('data.0.action', 'grade.created');
    }

    // NB : dans un même test, le garde Sanctum est un singleton déjà résolu —
    // il ne faut pas mélanger deux utilisateurs dans une même méthode.
    public function test_the_audit_log_is_readable_by_the_direction(): void
    {
        [$token] = $this->setupWorkspace();

        $this->withToken($token)->getJson('/api/audit-logs')->assertOk();
    }

    public function test_the_audit_log_is_forbidden_to_other_roles(): void
    {
        $this->setupWorkspace();
        $secretariat = User::create([
            'name' => 'Secrétariat Test',
            'email' => 'secretariat@exemple.test',
            'password' => 'motdepasse123',
            'role' => User::ROLE_SECRETARIAT,
        ]);
        $secretariatToken = $secretariat->createToken('test')->plainTextToken;

        $this->withToken($secretariatToken)->getJson('/api/audit-logs')->assertForbidden();
        $this->withToken($secretariatToken)->patchJson('/api/references/terms/1/lock', ['locked' => true])->assertForbidden();
    }

    /**
     * @return array{0: string, 1: Term}
     */
    private function setupWorkspace(): array
    {
        $response = $this->postJson('/api/setup', [
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
        ]);
        $response->assertCreated();

        return [
            (string) $response->json('token'),
            Term::query()->where('is_current', true)->firstOrFail(),
        ];
    }

    /**
     * @return array{0: Student, 1: Subject}
     */
    private function createStudentAndSubject(): array
    {
        $student = Student::create([
            'matricule' => 'ELV-TEST-001',
            'first_name' => 'Aminatou',
            'last_name' => 'Koné',
            'gender' => 'F',
            'birth_date' => '2014-03-15',
            'enrolled_on' => '2026-09-01',
        ]);
        $subject = Subject::create([
            'name' => 'Mathématiques',
            'code' => 'MA',
            'coefficient' => 4,
        ]);

        return [$student, $subject];
    }
}
