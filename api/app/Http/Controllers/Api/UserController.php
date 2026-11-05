<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate(['role' => ['nullable', Rule::in(User::ROLES)]]);

        $users = User::query()
            ->when($request->filled('role'), fn ($query) => $query->where('role', $request->string('role')))
            ->with('children:id,first_name,last_name,matricule')
            ->orderByRaw("CASE role WHEN 'direction' THEN 1 WHEN 'secretariat' THEN 2 WHEN 'comptable' THEN 3 WHEN 'enseignant' THEN 4 ELSE 5 END")
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'is_creator', 'created_at']);

        $payload = $users->map(fn (User $user) => array_merge(
            $user->only(['id', 'name', 'email', 'role', 'is_creator', 'created_at']),
            ['children' => $user->children->map(fn (Student $child) => [
                'id' => $child->id,
                'name' => trim($child->first_name.' '.$child->last_name),
                'matricule' => $child->matricule,
            ])->values()],
        ));

        return response()->json(['users' => $payload]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());

        $studentIds = $this->extractStudentIds($data);
        if ($data['role'] === User::ROLE_PARENT && ($studentIds === null || $studentIds === [])) {
            throw ValidationException::withMessages([
                'student_ids' => ['Liez au moins un élève au compte parent.'],
            ]);
        }

        $user = User::create($data);
        if ($user->role === User::ROLE_PARENT) {
            $user->children()->sync($studentIds ?? []);
            $this->recordLinks($user, [], $studentIds ?? []);
        }
        AuditLog::record('user.created', $user, "Compte créé : {$user->name} ({$user->role})");

        return response()->json(['user' => $user], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate($this->rules($user));
        $nextRole = $data['role'] ?? $user->role;

        if ($nextRole !== User::ROLE_DIRECTION && $this->isLastDirection($user)) {
            throw ValidationException::withMessages([
                'role' => ['Il doit rester au moins un compte de direction.'],
            ]);
        }

        if (array_key_exists('password', $data) && blank($data['password'])) {
            unset($data['password']);
        }
        $passwordChanged = array_key_exists('password', $data);
        $studentIds = $this->extractStudentIds($data);

        $previousRole = $user->role;
        $user->update($data);

        // Un changement de mot de passe invalide toutes les sessions
        // existantes du compte (les jetons Sanctum sont supprimés).
        if ($passwordChanged) {
            $user->tokens()->delete();
        }

        if ($studentIds !== null && $user->role === User::ROLE_PARENT) {
            $before = $user->children()->pluck('students.id')->all();
            $user->children()->sync($studentIds);
            $this->recordLinks($user, $before, $studentIds);
        }
        $properties = [];
        if ($previousRole !== $user->role) {
            $properties['role'] = ['avant' => $previousRole, 'après' => $user->role];
        }
        if (array_key_exists('password', $data)) {
            $properties['password_changed'] = true;
        }
        AuditLog::record('user.updated', $user, "Compte modifié : {$user->name}", $properties);

        return response()->json(['user' => $user->fresh()]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user()->is($user)) {
            return response()->json([
                'message' => 'Vous ne pouvez pas supprimer votre propre compte.',
            ], 422);
        }

        if ($this->isLastDirection($user)) {
            return response()->json([
                'message' => 'Il doit rester au moins un compte de direction.',
            ], 422);
        }

        $name = $user->name;
        $role = $user->role;
        $user->delete();
        AuditLog::record('user.deleted', $user, "Compte supprimé : {$name} ({$role})");

        return response()->json(status: 204);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function rules(?User $user = null): array
    {
        return [
            'name' => [$user ? 'sometimes' : 'required', 'string', 'max:120'],
            'email' => [
                $user ? 'sometimes' : 'required',
                'email',
                'max:190',
                Rule::unique('users', 'email')->ignore($user?->id),
            ],
            'password' => [$user ? 'nullable' : 'required', 'string', 'min:10'],
            'role' => [
                $user ? 'sometimes' : 'required',
                Rule::in(User::ROLES),
            ],
            // Liaisons parent ↔ élève (comptes parents uniquement).
            'student_ids' => ['sometimes', 'array'],
            'student_ids.*' => ['integer', 'distinct', 'exists:students,id'],
        ];
    }

    /**
     * Valide et normalise la liste d'identifiants d'élèves envoyée avec
     * le compte. Renvoie null quand le champ n'est pas fourni, [] quand
     * la liste est vide.
     *
     * @param  array<string, mixed>  $data
     * @return array<int, int>|null
     */
    private function extractStudentIds(array &$data): ?array
    {
        if (! array_key_exists('student_ids', $data)) {
            return null;
        }

        $ids = collect($data['student_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->filter()
            ->unique()
            ->values()
            ->all();

        unset($data['student_ids']);

        return $ids;
    }

    /**
     * Journalise les ajouts/retraits de liaisons parent ↔ élève.
     *
     * @param  array<int, int>  $before
     * @param  array<int, int>  $after
     */
    private function recordLinks(User $user, array $before, array $after): void
    {
        $added = array_values(array_diff($after, $before));
        $removed = array_values(array_diff($before, $after));

        if ($added === [] && $removed === []) {
            return;
        }

        AuditLog::record(
            'parent.links_updated',
            $user,
            "Liaisons parent ↔ élève mises à jour : {$user->name}",
            ['ajoutes' => $added, 'retires' => $removed],
        );
    }

    private function isLastDirection(User $user): bool
    {
        if (! $user->isDirection()) {
            return false;
        }

        return ! User::query()
            ->where('role', User::ROLE_DIRECTION)
            ->where('id', '!=', $user->id)
            ->exists();
    }
}
