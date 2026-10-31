<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admission;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdmissionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $admissions = Admission::query()
            ->with('desiredClass:id,name,level,room')
            ->when($request->filled('q'), function ($query) use ($request) {
                $term = '%'.$request->string('q')->toString().'%';
                $query->where(function ($query) use ($term) {
                    $query->where('first_name', 'like', $term)
                        ->orWhere('last_name', 'like', $term)
                        ->orWhere('reference', 'like', $term)
                        ->orWhere('guardian_name', 'like', $term);
                });
            })
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('class_id'), fn ($query) => $query->where('desired_class_id', $request->integer('class_id')))
            ->latest('applied_on')
            ->paginate($request->integer('per_page', 30))
            ->withQueryString();

        return response()->json($admissions);
    }

    public function stats(): JsonResponse
    {
        $columns = ['nouveau', 'entretien', 'valide', 'inscrit', 'refuse'];
        $counts = Admission::query()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return response()->json([
            'columns' => collect($columns)->map(fn ($status) => [
                'status' => $status,
                'label' => Str::headline($status),
                'total' => (int) ($counts[$status] ?? 0),
            ]),
            'total' => $counts->sum(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $data['reference'] ??= 'REF-'.now()->format('Y').'-'.Str::upper(Str::random(5));
        $admission = Admission::create($data);

        return response()->json(['admission' => $admission->load('desiredClass:id,name,level')], 201);
    }

    public function show(Admission $admission): JsonResponse
    {
        return response()->json(['admission' => $admission->load('desiredClass:id,name,level,room')]);
    }

    public function update(Request $request, Admission $admission): JsonResponse
    {
        $data = $request->validate($this->rules($admission));

        if (isset($data['status']) && in_array($data['status'], ['valide', 'inscrit', 'refuse'], true) && ! $admission->decision_on) {
            $data['decision_on'] = now()->toDateString();
        }

        $admission->update($data);

        return response()->json(['admission' => $admission->fresh()->load('desiredClass:id,name,level')]);
    }

    public function enroll(Admission $admission): JsonResponse
    {
        if ($admission->status === 'inscrit') {
            return response()->json(['message' => 'Candidature déjà inscrite.'], 422);
        }

        $class = $admission->desiredClass ?: SchoolClass::query()->orderBy('id')->first();
        if (! $class) {
            return response()->json(['message' => 'Aucune classe disponible.'], 422);
        }

        $student = Student::create([
            'school_class_id' => $class->id,
            'matricule' => '2026-'.str_pad((string) (Student::max('id') + 1), 4, '0', STR_PAD_LEFT),
            'first_name' => $admission->first_name,
            'last_name' => $admission->last_name,
            'gender' => $admission->gender,
            'birth_date' => $admission->birth_date,
            'email' => $admission->guardian_email,
            'guardian_name' => $admission->guardian_name,
            'guardian_phone' => $admission->guardian_phone,
            'guardian_email' => $admission->guardian_email,
            'status' => 'a_jour',
            'enrolled_on' => now()->toDateString(),
            'is_active' => true,
        ]);

        $admission->update(['status' => 'inscrit', 'decision_on' => now()->toDateString()]);

        return response()->json([
            'admission' => $admission->fresh()->load('desiredClass:id,name,level'),
            'student' => $student->load('schoolClass:id,name,level'),
        ], 201);
    }

    public function destroy(Admission $admission): JsonResponse
    {
        $admission->delete();

        return response()->json(status: 204);
    }

    private function rules(?Admission $admission = null): array
    {
        return [
            'reference' => ['nullable', 'string', 'max:60', Rule::unique('admissions', 'reference')->ignore($admission?->id)],
            'first_name' => [$admission ? 'sometimes' : 'required', 'string', 'max:120'],
            'last_name' => [$admission ? 'sometimes' : 'required', 'string', 'max:120'],
            'gender' => ['nullable', Rule::in(['M', 'F'])],
            'birth_date' => ['nullable', 'date'],
            'desired_class_id' => ['nullable', 'integer', 'exists:school_classes,id'],
            'guardian_name' => ['nullable', 'string', 'max:180'],
            'guardian_phone' => ['nullable', 'string', 'max:40'],
            'guardian_email' => ['nullable', 'email', 'max:180'],
            'status' => ['nullable', Rule::in(['nouveau', 'entretien', 'valide', 'inscrit', 'refuse'])],
            'applied_on' => [$admission ? 'sometimes' : 'required', 'date'],
            'decision_on' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
