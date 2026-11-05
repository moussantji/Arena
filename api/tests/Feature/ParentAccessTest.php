<?php

namespace Tests\Feature;

use App\Models\Absence;
use App\Models\AcademicYear;
use App\Models\FeeType;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

/**
 * Accès « parent » : périmètre restreint aux enfants liés, aucune fuite
 * vers les autres données de l'établissement, gestion par la direction.
 */
class ParentAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_parent_cannot_log_in_to_the_desktop_app_but_can_use_mobile(): void
    {
        $parent = $this->createUser('parent@exemple.test', User::ROLE_PARENT);

        $response = $this->postJson('/api/login', [
            'email' => 'parent@exemple.test',
            'password' => 'motdepasse123',
            'device_name' => 'kalanso-desktop',
        ]);
        $response->assertStatus(403);
        $this->assertStringContainsString('mobile', (string) $response->json('message'));

        $this->postJson('/api/login', [
            'email' => 'parent@exemple.test',
            'password' => 'motdepasse123',
            'device_name' => 'kalanso-mobile',
        ])->assertOk();

        $this->assertDatabaseHas('users', ['email' => 'parent@exemple.test']);
    }

    public function test_parent_is_forbidden_from_global_school_endpoints(): void
    {
        $parent = $this->createUser('parent@exemple.test', User::ROLE_PARENT);
        $token = $parent->createToken('kalanso-mobile')->plainTextToken;

        $this->withToken($token)->getJson('/api/meta')->assertForbidden();
        $this->withToken($token)->getJson('/api/dashboard')->assertForbidden();
        $this->withToken($token)->getJson('/api/school')->assertForbidden();
        $this->withToken($token)->getJson('/api/students')->assertForbidden();
        $this->withToken($token)->getJson('/api/notifications')->assertForbidden();
        $this->withToken($token)->getJson('/api/grades')->assertForbidden();
        $this->withToken($token)->getJson('/api/absences')->assertForbidden();
        $this->withToken($token)->getJson('/api/invoices')->assertForbidden();
        $this->withToken($token)->getJson('/api/threads')->assertOk();
        $this->withToken($token)->getJson('/api/me')->assertOk();
    }

    public function test_unauthenticated_requests_are_rejected(): void
    {
        $this->getJson('/api/parent/children')->assertUnauthorized();
    }

    public function test_parent_lists_only_linked_children_and_cannot_see_others(): void
    {
        [$parent, $linked, $stranger] = $this->parentWithTwoChildren();
        $token = $parent->createToken('kalanso-mobile')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/parent/children')->assertOk();
        $children = $response->json('children');
        $this->assertCount(1, $children);
        $this->assertSame($linked->id, $children[0]['id']);

        // Enfant lié : OK. Enfant non lié : introuvable (existence masquée).
        $this->withToken($token)->getJson("/api/parent/children/{$linked->id}")->assertOk();
        $this->withToken($token)->getJson("/api/parent/children/{$stranger->id}")->assertNotFound();
        $this->withToken($token)->getJson("/api/parent/children/{$stranger->id}/report-card")->assertNotFound();
        $this->withToken($token)->getJson("/api/parent/children/{$stranger->id}/absences")->assertNotFound();
        $this->withToken($token)->getJson("/api/parent/children/{$stranger->id}/finances")->assertNotFound();
    }

    public function test_parent_receives_bulletin_absences_and_finances_of_linked_child_only(): void
    {
        [$parent, $child] = $this->parentWithChild();
        $token = $parent->createToken('kalanso-mobile')->plainTextToken;

        // Bulletin : l'enfant lié est accessible.
        $bulletin = $this->withToken($token)->getJson("/api/parent/children/{$child->id}/report-card")->assertOk();
        $this->assertSame($child->id, $bulletin->json('student.id'));

        // Absences : une absence de l'enfant apparaît avec le bon total.
        $absence = Absence::create([
            'student_id' => $child->id,
            'school_class_id' => $child->school_class_id,
            'date' => '2026-10-12',
            'reason' => 'Maladie',
            'is_justified' => false,
        ]);
        $response = $this->withToken($token)->getJson("/api/parent/children/{$child->id}/absences")->assertOk();
        $this->assertCount(1, $response->json('absences'));
        $this->assertSame(1, $response->json('summary.unjustified'));

        // Finances : la facture de l'enfant et son solde sont visibles.
        $feeType = FeeType::create(['name' => 'Scolarité', 'code' => 'SCO', 'default_amount' => 50000, 'is_active' => true]);
        $invoice = Invoice::create([
            'reference' => 'FAC-TEST-001',
            'student_id' => $child->id,
            'fee_type_id' => $feeType->id,
            'issued_on' => '2026-10-01',
            'due_on' => '2026-10-31',
            'amount' => 50000,
            'status' => 'partial',
        ]);
        Payment::create([
            'invoice_id' => $invoice->id,
            'student_id' => $child->id,
            'amount' => 20000,
            'status' => 'completed',
            'method' => 'cash',
            'paid_on' => '2026-10-05',
        ]);
        Payment::create([
            'invoice_id' => $invoice->id,
            'student_id' => $child->id,
            'amount' => 10000,
            'status' => 'pending',
            'method' => 'cash',
            'paid_on' => '2026-10-06',
        ]);

        $response = $this->withToken($token)->getJson("/api/parent/children/{$child->id}/finances")->assertOk();
        $this->assertSame(50000.0, (float) $response->json('summary.total_due'));
        $this->assertSame(20000.0, (float) $response->json('summary.total_paid'));
        $this->assertSame(30000.0, (float) $response->json('summary.outstanding'));
    }

    public function test_direction_creates_parent_with_linked_children(): void
    {
        $this->postJson('/api/setup', $this->setupPayload())->assertCreated();
        $token = (string) $this->postJson('/api/login', [
            'email' => 'direction@exemple.test',
            'password' => 'motdepasse123',
            'device_name' => 'kalanso-desktop',
        ])->assertOk()->json('token');

        $child = Student::create([
            'matricule' => 'ELV-PAR-001',
            'first_name' => 'Mariam',
            'last_name' => 'Diarra',
            'gender' => 'F',
            'birth_date' => '2015-04-12',
            'enrolled_on' => '2026-09-01',
        ]);

        // Sans élève lié, le compte parent est refusé.
        $this->withToken($token)->postJson('/api/users', [
            'name' => 'Parent Test',
            'email' => 'parent@exemple.test',
            'password' => 'motdepasse456',
            'role' => User::ROLE_PARENT,
        ])->assertStatus(422)->assertJsonValidationErrors(['student_ids']);

        // Avec élève lié, le compte est créé et journalisé.
        $this->withToken($token)->postJson('/api/users', [
            'name' => 'Parent Test',
            'email' => 'parent@exemple.test',
            'password' => 'motdepasse456',
            'role' => User::ROLE_PARENT,
            'student_ids' => [$child->id],
        ])->assertCreated();

        $parent = User::where('email', 'parent@exemple.test')->firstOrFail();
        $this->assertDatabaseHas('parent_student', ['user_id' => $parent->id, 'student_id' => $child->id]);

        // La liaison est bien visible par le parent lui-même.
        // (forgetGuards : les tests réutilisent la même application entre
        // les requêtes et le garde Sanctum garde en cache l'utilisateur
        // résolu ; la direction était déjà authentifiée dans ce test.)
        auth()->forgetGuards();
        $parentToken = $parent->createToken('kalanso-mobile')->plainTextToken;
        $this->withToken($parentToken)->getJson('/api/parent/children')
            ->assertOk()
            ->assertJsonCount(1, 'children');
    }

    public function test_direction_updates_parent_links(): void
    {
        $this->postJson('/api/setup', $this->setupPayload())->assertCreated();
        $token = (string) $this->postJson('/api/login', [
            'email' => 'direction@exemple.test',
            'password' => 'motdepasse123',
            'device_name' => 'kalanso-desktop',
        ])->assertOk()->json('token');

        $childA = Student::create([
            'matricule' => 'ELV-PAR-010', 'first_name' => 'Aïcha', 'last_name' => 'Traoré',
            'gender' => 'F', 'birth_date' => '2014-02-10', 'enrolled_on' => '2026-09-01',
        ]);
        $childB = Student::create([
            'matricule' => 'ELV-PAR-011', 'first_name' => 'Moussa', 'last_name' => 'Traoré',
            'gender' => 'M', 'birth_date' => '2016-06-20', 'enrolled_on' => '2026-09-01',
        ]);

        $this->withToken($token)->postJson('/api/users', [
            'name' => 'Parent Test', 'email' => 'parent@exemple.test',
            'password' => 'motdepasse456', 'role' => User::ROLE_PARENT,
            'student_ids' => [$childA->id],
        ])->assertCreated();
        $parent = User::where('email', 'parent@exemple.test')->firstOrFail();

        // Relier l'autre enfant (synchronisation complète des liaisons).
        $this->withToken($token)->putJson("/api/users/{$parent->id}", [
            'student_ids' => [$childA->id, $childB->id],
        ])->assertOk();
        $this->assertDatabaseHas('parent_student', ['user_id' => $parent->id, 'student_id' => $childB->id]);

        // Retirer l'enfant A : seulement B reste lié.
        $this->withToken($token)->putJson("/api/users/{$parent->id}", [
            'student_ids' => [$childB->id],
        ])->assertOk();
        $this->assertDatabaseMissing('parent_student', ['user_id' => $parent->id, 'student_id' => $childA->id]);
        $this->assertDatabaseHas('parent_student', ['user_id' => $parent->id, 'student_id' => $childB->id]);
    }

    public function test_parent_can_change_own_password_and_sessions_elsewhere_are_revoked(): void
    {
        $parent = $this->createUser('parent@exemple.test', User::ROLE_PARENT);
        $token = $parent->createToken('kalanso-mobile')->plainTextToken;
        $other = $parent->createToken('kalanso-mobile-2')->plainTextToken;

        // Mauvais mot de passe actuel : refusé.
        $this->withToken($token)->postJson('/api/me/password', [
            'current_password' => 'mauvais-mot-de-passe',
            'password' => 'nouveaumdp456',
            'password_confirmation' => 'nouveaumdp456',
        ])->assertStatus(422)->assertJsonValidationErrors(['current_password']);

        // Mot de passe actuel valide : changé, l'autre session est révoquée.
        $this->withToken($token)->postJson('/api/me/password', [
            'current_password' => 'motdepasse123',
            'password' => 'nouveaumdp456',
            'password_confirmation' => 'nouveaumdp456',
        ])->assertOk();

        $this->assertNull(PersonalAccessToken::findToken($other));
        $this->assertNotNull(PersonalAccessToken::findToken($token));

        // L'ancien mot de passe ne fonctionne plus.
        $this->postJson('/api/login', [
            'email' => 'parent@exemple.test',
            'password' => 'motdepasse123',
            'device_name' => 'kalanso-mobile',
        ])->assertStatus(422);
    }

    public function test_non_staff_cannot_manage_parent_accounts(): void
    {
        $parent = $this->createUser('parent@exemple.test', User::ROLE_PARENT);
        $token = $parent->createToken('kalanso-mobile')->plainTextToken;

        $this->withToken($token)->getJson('/api/users')->assertForbidden();
        $this->withToken($token)->postJson('/api/users', [
            'name' => 'Intrus', 'email' => 'intrus@exemple.test',
            'password' => 'motdepasse456', 'role' => User::ROLE_PARENT,
        ])->assertForbidden();
    }

    public function test_parent_only_sees_own_threads_and_never_internal_staff_threads(): void
    {
        $direction = $this->createUser('direction@exemple.test', User::ROLE_DIRECTION);
        $parent = $this->createUser('parent@exemple.test', User::ROLE_PARENT);

        // Fil interne créé par la direction.
        $directionToken = $direction->createToken('kalanso-mobile')->plainTextToken;
        $staffThreadId = (int) $this->withToken($directionToken)->postJson('/api/threads', [
            'subject' => 'Conseil de classe',
            'type' => 'internal',
            'body' => 'Point interne au personnel.',
        ])->assertCreated()->json('thread.id');

        // Le parent ne voit pas le fil interne, même en direct.
        auth()->forgetGuards();
        $parentToken = $parent->createToken('kalanso-mobile')->plainTextToken;
        $this->withToken($parentToken)->getJson('/api/threads')
            ->assertOk()
            ->assertJsonCount(0, 'threads');
        $this->withToken($parentToken)->getJson("/api/threads/{$staffThreadId}")->assertNotFound();
        $this->withToken($parentToken)->postJson("/api/threads/{$staffThreadId}/messages", [
            'body' => 'Je sors du rang.',
        ])->assertNotFound();

        // Le parent ouvre son propre fil ; le type est forcé à « parent ».
        auth()->forgetGuards();
        $ownThreadId = (int) $this->withToken($parentToken)->postJson('/api/threads', [
            'subject' => 'Sortie scolaire',
            'body' => 'Bonjour, une question.',
            'type' => 'internal',
        ])->assertCreated()->assertJsonPath('thread.type', 'parent')->json('thread.id');
        $this->withToken($parentToken)->getJson("/api/threads/{$ownThreadId}")->assertOk();

        // Le personnel, lui, voit tous les fils.
        auth()->forgetGuards();
        $this->withToken($directionToken)->getJson("/api/threads/{$ownThreadId}")->assertOk();
    }

    private function createUser(string $email, string $role): User
    {
        return User::create([
            'name' => ucfirst($role).' Test',
            'email' => $email,
            'password' => 'motdepasse123',
            'role' => $role,
        ]);
    }

    /**
     * @return array{0: User, 1: Student, 2: Student}
     */
    private function parentWithTwoChildren(): array
    {
        $parent = $this->createUser('parent@exemple.test', User::ROLE_PARENT);
        $year = AcademicYear::createWithTerms('2026 — 2027', '2026-09-01', '2027-06-30');
        $class = SchoolClass::create(['academic_year_id' => $year->id, 'name' => '6e A', 'level' => '6e', 'capacity' => 30]);

        $linked = Student::create([
            'matricule' => 'ELV-PAR-101', 'first_name' => 'Awa', 'last_name' => 'Sangaré',
            'gender' => 'F', 'birth_date' => '2014-01-15', 'enrolled_on' => '2026-09-01',
            'school_class_id' => $class->id,
        ]);
        $stranger = Student::create([
            'matricule' => 'ELV-PAR-102', 'first_name' => 'Adama', 'last_name' => 'Sangaré',
            'gender' => 'M', 'birth_date' => '2016-08-20', 'enrolled_on' => '2026-09-01',
            'school_class_id' => $class->id,
        ]);

        $parent->children()->sync([$linked->id]);

        return [$parent, $linked, $stranger];
    }

    /**
     * @return array{0: User, 1: Student}
     */
    private function parentWithChild(): array
    {
        [$parent, $linked] = $this->parentWithTwoChildren();

        return [$parent, $linked];
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
