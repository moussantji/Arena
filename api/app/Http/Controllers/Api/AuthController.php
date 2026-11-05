<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Support\DesktopAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:80'],
        ]);

        $user = User::where('email', $data['email'])->first();
        if (! $user || ! Hash::check($data['password'], $user->password)) {
            // Tentative infructueuse journalisée (anti force brute, audit) —
            // jamais le mot de passe tenté.
            AuditLog::record(
                'auth.login_failed',
                $user,
                "Échec de connexion : {$data['email']}",
                ['email' => $data['email']],
                $user,
            );
            throw ValidationException::withMessages(['email' => ['Identifiants invalides.']]);
        }

        // Restriction PC : les comptes enseignants utilisent (à venir)
        // l'application mobile, pas le poste de l'établissement.
        DesktopAccess::assertAllowed($user, $data['device_name'] ?? 'kalanso-desktop');

        $token = $user->createToken($data['device_name'] ?? 'desktop')->plainTextToken;
        AuditLog::record('auth.login', $user, "Connexion : {$user->name}", [], $user);

        return response()->json(['token' => $token, 'user' => $user->load('photos:id,user_id,filename')]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()->load('photos:id,user_id,filename')]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Déconnecté.']);
    }
}
