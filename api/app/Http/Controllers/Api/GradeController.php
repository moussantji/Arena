<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Grade;
use App\Models\Student;
use App\Models\Term;
use App\Support\ReportCard;
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
        $term = Term::query()->find($data['term_id']);
        if ($term?->isLocked()) {
            return $this->lockedResponse();
        }

        $data['school_class_id'] ??= Student::find($data['student_id'])?->school_class_id;
        $existing = Grade::query()
            ->where('student_id', $data['student_id'])
            ->where('subject_id', $data['subject_id'])
            ->where('term_id', $data['term_id'])
            ->where('evaluation', $data['evaluation'])
            ->first();
        $previousScore = $existing?->score;

        $grade = Grade::updateOrCreate(
            [
                'student_id' => $data['student_id'],
                'subject_id' => $data['subject_id'],
                'term_id' => $data['term_id'],
                'evaluation' => $data['evaluation'],
            ],
            $data
        );
        $grade->loadMissing('student:id,first_name,last_name,matricule', 'subject:id,name,code');

        if ($existing) {
            AuditLog::record('grade.updated', $grade, $this->describeGrade($grade, 'modifiée'), [
                'score' => ['avant' => $previousScore, 'après' => $grade->score],
            ]);
        } else {
            AuditLog::record('grade.created', $grade, $this->describeGrade($grade, 'saisie'));
        }

        return response()->json(['grade' => $grade], $grade->wasRecentlyCreated ? 201 : 200);
    }

    public function show(Grade $grade): JsonResponse
    {
        return response()->json(['grade' => $grade->load('student', 'subject', 'term', 'schoolClass')]);
    }

    public function update(Request $request, Grade $grade): JsonResponse
    {
        $grade->loadMissing('term:id,name,locked_at');
        if ($grade->term?->isLocked()) {
            return $this->lockedResponse();
        }

        $previousScore = $grade->score;
        $grade->update($request->validate($this->rules($grade)));
        $grade->loadMissing('student:id,first_name,last_name,matricule', 'subject:id,name,code');
        AuditLog::record('grade.updated', $grade, $this->describeGrade($grade, 'modifiée'), [
            'score' => ['avant' => $previousScore, 'après' => $grade->score],
        ]);

        return response()->json(['grade' => $grade->fresh()->load('student:id,first_name,last_name,matricule', 'subject:id,name,code')]);
    }

    public function destroy(Grade $grade): JsonResponse
    {
        $grade->loadMissing('term:id,name,locked_at', 'student:id,first_name,last_name,matricule', 'subject:id,name,code');
        if ($grade->term?->isLocked()) {
            return $this->lockedResponse();
        }

        $description = $this->describeGrade($grade, 'supprimée');
        $score = $grade->score;
        $grade->delete();
        AuditLog::record('grade.deleted', $grade, $description, ['score' => $score]);

        return response()->json(status: 204);
    }

    public function reportCard(Request $request, Student $student): JsonResponse
    {
        $term = ReportCard::resolveTerm($request);

        return response()->json(ReportCard::build($student, $term));
    }

    /**
     * Verrou de délibération : une période verrouillée n'accepte plus aucune
     * écriture sur les notes.
     */
    private function lockedResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Cette période est délibérée et verrouillée : les notes ne peuvent plus être modifiées.',
        ], 403);
    }

    private function describeGrade(Grade $grade, string $verb): string
    {
        $student = $grade->student
            ? trim($grade->student->first_name.' '.$grade->student->last_name)
            : 'Élève #'.$grade->student_id;
        $subject = $grade->subject?->name ?? 'Matière #'.$grade->subject_id;

        return sprintf(
            'Note %s : %s · %s · %s = %s/20',
            $verb,
            $student,
            $subject,
            $this->evaluationLabel((string) $grade->evaluation),
            $grade->score,
        );
    }

    private function evaluationLabel(string $evaluation): string
    {
        return match ($evaluation) {
            'devoir_1' => 'Devoir 1',
            'devoir_2' => 'Devoir 2',
            'composition' => 'Composition',
            default => $evaluation,
        };
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
