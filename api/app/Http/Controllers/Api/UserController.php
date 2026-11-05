<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::query()
            ->orderByRaw("CASE role WHEN 'direction' THEN 1 WHEN 'secretariat' THEN 2 WHEN 'comptable' THEN 3 ELSE 4 END")
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'created_at']);

        return response()->json(['users' => $users]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());

        $user = User::create($data);
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

        $previousRole = $user->role;
        $user->update($data);

        // Un changement de mot de passe invalide toutes les sessions
        // existantes du compte (les jetons Sanctum sont supprimés).
        if ($passwordChanged) {
            $user->tokens()->delete();
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
        ];
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
