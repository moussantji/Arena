<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Grade;
use App\Models\Student;
use App\Models\Term;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class GradeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Grade::query()
            ->with([
                'student:id,matricule,first_name,last_name,school_class_id',
                'subject:id,name,code,coefficient',
                'term:id,name',
                'schoolClass:id,name,level',
            ])
            ->when($request->filled('student_id'), fn ($builder) => $builder->where('student_id', $request->integer('student_id')))
            ->when($request->filled('subject_id'), fn ($builder) => $builder->where('subject_id', $request->integer('subject_id')))
            ->when($request->filled('class_id'), fn ($builder) => $builder->where('school_class_id', $request->integer('class_id')))
            ->when($request->filled('term_id'), fn ($builder) => $builder->where('term_id', $request->integer('term_id')))
            ->when($request->filled('evaluation'), fn ($builder) => $builder->where('evaluation', $request->string('evaluation')))
            ->when($request->filled('q'), function ($builder) use ($request) {
                $term = '%'.$request->input('q').'%';
                $builder->whereHas('student', fn ($student) => $student
                    ->where('first_name', 'like', $term)
                    ->orWhere('last_name', 'like', $term)
                    ->orWhere('matricule', 'like', $term));
            });

        $latestExam = null;
        if ($request->boolean('latest_exam')) {
            $latestDate = (clone $query)->max('evaluated_on');
            if ($latestDate) {
                $latestDate = Carbon::parse($latestDate)->toDateString();
                $query->whereDate('evaluated_on', $latestDate);
                $latestExam = (clone $query)->with('term:id,name')->first();
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        $stats = (clone $query)
            ->reorder()
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('ROUND(AVG(score / max_score * 20), 2) as average')
            ->selectRaw('ROUND(MAX(score / max_score * 20), 2) as best')
            ->selectRaw('SUM(CASE WHEN score / max_score * 20 < 10 THEN 1 ELSE 0 END) as below_ten')
            ->first();
        $grades = $query
            ->orderBy('evaluated_on')
            ->orderBy('id')
            ->paginate($request->integer('per_page', 50))
            ->withQueryString();

        return response()->json([
            ...$grades->toArray(),
            'latest_exam' => $latestExam ? [
                'date' => $latestExam->evaluated_on?->toDateString(),
                'evaluation' => $latestExam->evaluation,
                'term' => $latestExam->term?->name,
            ] : null,
            'stats' => [
                'total' => (int) ($stats->total ?? 0),
                'average' => $stats?->average !== null ? (float) $stats->average : null,
                'best' => $stats?->best !== null ? (float) $stats->best : null,
                'below_ten' => (int) ($stats->below_ten ?? 0),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $data['school_class_id'] ??= Student::find($data['student_id'])?->school_class_id;
        $grade = Grade::updateOrCreate(
            [
                'student_id' => $data['student_id'],
                'subject_id' => $data['subject_id'],
                'term_id' => $data['term_id'],
                'evaluation' => $data['evaluation'],
            ],
            $data
        );

        return response()->json(['grade' => $grade->load('student:id,first_name,last_name,matricule', 'subject:id,name,code')], $grade->wasRecentlyCreated ? 201 : 200);
    }

    public function show(Grade $grade): JsonResponse
    {
        return response()->json(['grade' => $grade->load('student', 'subject', 'term', 'schoolClass')]);
    }

    public function update(Request $request, Grade $grade): JsonResponse
    {
        $grade->update($request->validate($this->rules($grade)));

        return response()->json(['grade' => $grade->fresh()->load('student:id,first_name,last_name,matricule', 'subject:id,name,code')]);
    }

    public function destroy(Grade $grade): JsonResponse
    {
        $grade->delete();

        return response()->json(status: 204);
    }

    public function reportCard(Request $request, Student $student): JsonResponse
    {
        $term = $request->filled('term_id')
            ? Term::findOrFail($request->integer('term_id'))
            : Term::current()->first();

        $grades = $student->grades()
            ->with('subject:id,name,code,coefficient')
            ->when($term, fn ($query) => $query->where('term_id', $term->id))
            ->get();

        $subjects = $grades->groupBy('subject_id')->map(function ($subjectGrades) {
            $subject = $subjectGrades->first()->subject;
            $average = round($subjectGrades->avg(fn ($grade) => ((float) $grade->score / max(1, (float) $grade->max_score)) * 20), 2);

            return [
                'subject_id' => $subject?->id,
                'subject' => $subject?->name,
                'code' => $subject?->code,
                'coefficient' => (float) ($subject?->coefficient ?? 1),
                'average' => $average,
                'grades' => $subjectGrades->map(fn ($grade) => [
                    'evaluation' => $grade->evaluation,
                    'score' => (float) $grade->score,
                    'max_score' => (float) $grade->max_score,
                    'evaluated_on' => $grade->evaluated_on?->toDateString(),
                ])->values(),
            ];
        })->values();

        $totalCoefficients = $subjects->sum('coefficient');
        $generalAverage = $totalCoefficients > 0
            ? round($subjects->sum(fn ($subject) => $subject['average'] * $subject['coefficient']) / $totalCoefficients, 2)
            : null;

        $classAverages = Grade::query()
            ->selectRaw('student_id, AVG(score / max_score * 20) as average')
            ->where('school_class_id', $student->school_class_id)
            ->when($term, fn ($query) => $query->where('term_id', $term->id))
            ->groupBy('student_id')
            ->orderByDesc('average')
            ->pluck('average');

        $rank = $generalAverage !== null ? $classAverages->search(fn ($average) => round((float) $average, 2) <= $generalAverage) + 1 : null;

        return response()->json([
            'student' => $student->load('schoolClass:id,name,level,room'),
            'term' => $term,
            'subjects' => $subjects,
            'general_average' => $generalAverage,
            'total_coefficients' => $totalCoefficients,
            'rank' => $rank ?: null,
            'class_size' => $classAverages->count(),
            'mention' => match (true) {
                $generalAverage === null => null,
                $generalAverage >= 16 => 'Très bien',
                $generalAverage >= 14 => 'Bien',
                $generalAverage >= 12 => 'Assez bien',
                $generalAverage >= 10 => 'Passable',
                default => 'Insuffisant',
            },
        ]);
    }

    private function rules(?Grade $grade = null): array
    {
        return [
            'student_id' => [$grade ? 'sometimes' : 'required', 'integer', 'exists:students,id'],
            'subject_id' => [$grade ? 'sometimes' : 'required', 'integer', 'exists:subjects,id'],
            'term_id' => [$grade ? 'sometimes' : 'required', 'integer', 'exists:terms,id'],
            'school_class_id' => ['nullable', 'integer', 'exists:school_classes,id'],
            'evaluation' => [$grade ? 'sometimes' : 'required', Rule::in(['devoir_1', 'devoir_2', 'composition'])],
            'score' => [$grade ? 'sometimes' : 'required', 'numeric', 'min:0', 'max:20'],
            'max_score' => ['nullable', 'numeric', 'min:1', 'max:100'],
            'coefficient' => ['nullable', 'numeric', 'min:0.5', 'max:10'],
            'evaluated_on' => [$grade ? 'sometimes' : 'required', 'date'],
            'comment' => ['nullable', 'string', 'max:255'],
        ];
    }
}
