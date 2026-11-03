<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\School;
use App\Models\Term;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SetupController extends Controller
{
    /**
     * Indique si l'application attend encore sa première configuration.
     */
    public function status(): JsonResponse
    {
        return response()->json([
            'needs_setup' => $this->needsSetup(),
            'google_enabled' => $this->googleEnabled(),
            'app_name' => config('app.name'),
        ]);
    }

    /**
     * Crée l'établissement, l'année scolaire et le premier compte Direction.
     */
    public function store(Request $request): JsonResponse
    {
        if (! $this->needsSetup()) {
            return response()->json([
                'message' => 'Kalanso est déjà configuré. Connectez-vous avec votre compte.',
            ], 403);
        }

        $data = $request->validate([
            'school_name' => ['required', 'string', 'max:120'],
            'school_full_name' => ['required', 'string', 'max:180'],
            'school_email' => ['nullable', 'email', 'max:180'],
            'school_phone' => ['nullable', 'string', 'max:40'],
            'school_address' => ['nullable', 'string', 'max:255'],
            'currency' => ['required', Rule::in(['FCFA', 'EUR', 'USD'])],
            'year_label' => ['required', 'string', 'max:40'],
            'year_starts_on' => ['required', 'date'],
            'year_ends_on' => ['required', 'date', 'after:year_starts_on'],
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'school_name.required' => 'Le nom court de l’établissement est obligatoire.',
            'school_full_name.required' => 'Le nom complet de l’établissement est obligatoire.',
            'school_email.email' => 'L’adresse e-mail de l’établissement est invalide.',
            'year_label.required' => 'Le libellé de l’année scolaire est obligatoire.',
            'year_ends_on.after' => 'La fin de l’année doit suivre son début.',
            'name.required' => 'Le nom du responsable est obligatoire.',
            'email.required' => 'L’adresse e-mail du compte Direction est obligatoire.',
            'email.unique' => 'Un compte utilise déjà cette adresse e-mail.',
            'password.required' => 'Le mot de passe est obligatoire.',
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
            'password.confirmed' => 'Les deux mots de passe ne correspondent pas.',
        ]);

        $result = DB::transaction(function () use ($data): array {
            // Une base neuve ne contient aucun établissement. Si une base
            // partielle existe malgré tout, on la complète sans doublon.
            $school = School::query()->first() ?? new School;
            $school->fill([
                'name' => trim($data['school_name']),
                'full_name' => trim($data['school_full_name']),
                'email' => $data['school_email'] ?? null,
                'phone' => $data['school_phone'] ?? null,
                'address' => $data['school_address'] ?? null,
                'currency' => $data['currency'],
                'academic_year' => $data['year_label'],
                'term' => 'Trimestre 1',
            ])->save();

            AcademicYear::query()->update(['is_current' => false]);

            $year = AcademicYear::create([
                'label' => trim($data['year_label']),
                'starts_on' => $data['year_starts_on'],
                'ends_on' => $data['year_ends_on'],
                'is_current' => true,
            ]);

            $this->createTerms($year, $data['year_starts_on'], $data['year_ends_on']);

            $user = User::create([
                'name' => trim($data['name']),
                'email' => Str::lower(trim($data['email'])),
                'password' => $data['password'],
                'role' => User::ROLE_DIRECTION,
                'email_verified_at' => now(),
            ]);

            return [
                'school' => $school->fresh(),
                'year' => $year->fresh()->load('terms'),
                'user' => $user,
                'token' => $user->createToken('premier-compte')->plainTextToken,
            ];
        });

        return response()->json([
            'message' => 'Kalanso est prêt. Bienvenue dans votre espace de gestion.',
            'token' => $result['token'],
            'user' => $result['user']->load('photos:id,user_id,filename'),
            'school' => $result['school'],
            'academic_year' => $result['year'],
        ], 201);
    }

    private function needsSetup(): bool
    {
        return ! User::query()->exists();
    }

    private function googleEnabled(): bool
    {
        return filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'));
    }

    /**
     * Découpe l'année scolaire en trois trimestres équilibrés.
     */
    private function createTerms(AcademicYear $year, string $startsOn, string $endsOn): void
    {
        $start = CarbonImmutable::parse($startsOn)->startOfDay();
        $end = CarbonImmutable::parse($endsOn)->startOfDay();
        $totalDays = (int) $start->diffInDays($end) + 1;
        $baseLength = intdiv($totalDays, 3);
        $remainder = $totalDays % 3;
        $cursor = $start;

        for ($index = 1; $index <= 3; $index++) {
            $length = $baseLength + ($index <= $remainder ? 1 : 0);
            $termEnd = $index === 3 ? $end : $cursor->addDays(max($length - 1, 0));

            Term::create([
                'academic_year_id' => $year->id,
                'name' => "Trimestre {$index}",
                'starts_on' => $cursor->toDateString(),
                'ends_on' => $termEnd->toDateString(),
                'is_current' => $index === 1,
            ]);

            $cursor = $termEnd->addDay();
        }
    }
}
