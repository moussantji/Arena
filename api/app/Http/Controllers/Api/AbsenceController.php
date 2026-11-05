<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absence;
use App\Models\AuditLog;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AbsenceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Absence::query()
            ->with([
                'student:id,matricule,first_name,last_name,school_class_id',
                'student.schoolClass:id,name,level',
                'schoolClass:id,name,level',
                'recordedBy:id,first_name,last_name',
            ])
            ->when($request->filled('student_id'), fn ($builder) => $builder->where('student_id', $request->integer('student_id')))
            ->when($request->filled('class_id'), fn ($builder) => $builder->where('school_class_id', $request->integer('class_id')))
            ->when($request->filled('from'), fn ($builder) => $builder->where('date', '>=', $request->date('from')))
            ->when($request->filled('to'), fn ($builder) => $builder->where('date', '<=', $request->date('to')))
            ->when($request->has('justified'), fn ($builder) => $builder->where('is_justified', $request->boolean('justified')))
            ->when($request->filled('q'), function ($builder) use ($request) {
                $term = '%'.$request->input('q').'%';
                $builder->whereHas('student', fn ($student) => $student
                    ->where('first_name', 'like', $term)
                    ->orWhere('last_name', 'like', $term)
                    ->orWhere('matricule', 'like', $term));
            });

        $stats = (clone $query)
            ->reorder()
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN is_justified = 1 THEN 0 ELSE 1 END) as unjustified')
            ->selectRaw('ROUND(SUM(CASE WHEN is_justified = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0) * 100, 1) as justified_rate')
            ->first();

        $absences = $query
            ->latest('date')
            ->paginate($request->integer('per_page', 30))
            ->withQueryString();

        return response()->json([
            ...$absences->toArray(),
            'stats' => [
                'total' => (int) ($stats->total ?? 0),
                'unjustified' => (int) ($stats->unjustified ?? 0),
                'justified_rate' => (float) ($stats->justified_rate ?? 0),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $data['school_class_id'] ??= Student::find($data['student_id'])?->school_class_id;
        $absence = Absence::create($data);
        $absence->loadMissing('student:id,first_name,last_name,matricule');
        AuditLog::record('absence.created', $absence, $this->describe($absence, 'enregistrée'));

        return response()->json(['absence' => $absence], 201);
    }

    public function show(Absence $absence): JsonResponse
    {
        return response()->json(['absence' => $absence->load('student', 'schoolClass', 'recordedBy')]);
    }

    public function update(Request $request, Absence $absence): JsonResponse
    {
        $absence->update($request->validate($this->rules($absence)));
        $absence->loadMissing('student:id,first_name,last_name,matricule');
        AuditLog::record('absence.updated', $absence, $this->describe($absence, 'modifiée'));

        return response()->json(['absence' => $absence->fresh()->load('student:id,first_name,last_name,matricule')]);
    }

    public function justify(Request $request, Absence $absence): JsonResponse
    {
        $data = $request->validate([
            'justification' => ['required', 'string', 'max:500'],
            'reason' => ['nullable', 'string', 'max:120'],
        ]);
        $absence->update([
            'is_justified' => true,
            'justification' => $data['justification'],
            'reason' => $data['reason'] ?? $absence->reason,
        ]);
        $absence->loadMissing('student:id,first_name,last_name,matricule');
        AuditLog::record('absence.justified', $absence, $this->describe($absence, 'justifiée'));

        return response()->json(['absence' => $absence->fresh()->load('student:id,first_name,last_name,matricule')]);
    }

    public function destroy(Absence $absence): JsonResponse
    {
        $absence->loadMissing('student:id,first_name,last_name,matricule');
        $description = $this->describe($absence, 'supprimée');
        $absence->delete();
        AuditLog::record('absence.deleted', $absence, $description);

        return response()->json(status: 204);
    }

    private function describe(Absence $absence, string $verb): string
    {
        $student = $absence->student
            ? trim($absence->student->first_name.' '.$absence->student->last_name)
            : 'Élève #'.$absence->student_id;
        $date = $absence->date instanceof Carbon
            ? $absence->date->format('d/m/Y')
            : (string) $absence->date;

        return "Absence {$verb} : {$student} · {$date}";
    }

    private function rules(?Absence $absence = null): array
    {
        return [
            'student_id' => [$absence ? 'sometimes' : 'required', 'integer', 'exists:students,id'],
            'school_class_id' => ['nullable', 'integer', 'exists:school_classes,id'],
            'term_id' => ['nullable', 'integer', 'exists:terms,id'],
            'date' => [$absence ? 'sometimes' : 'required', 'date'],
            'starts_at' => ['nullable', 'date_format:H:i'],
            'ends_at' => ['nullable', 'date_format:H:i'],
            'reason' => ['nullable', 'string', 'max:120'],
            'is_justified' => ['boolean'],
            'justification' => ['nullable', 'string', 'max:500'],
            'recorded_by' => ['nullable', 'integer', 'exists:staff,id'],
        ];
    }
}
