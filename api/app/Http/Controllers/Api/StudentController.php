<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $canSeeFinance = $request->user()?->hasAnyRole(User::ROLE_DIRECTION, User::ROLE_COMPTABLE) ?? false;
        $relations = [
            'photos:id,student_id,filename',
            'schoolClass:id,name,level,room',
            'grades:id,student_id,score,max_score',
        ];

        if ($canSeeFinance) {
            $relations[] = 'invoices:id,student_id,amount,status';
            $relations[] = 'invoices.payments:id,invoice_id,amount,status';
        }

        $students = Student::query()
            ->with($relations)
            ->when($request->filled('q'), function ($query) use ($request) {
                $term = '%'.$request->string('q')->toString().'%';
                $query->where(function ($query) use ($term) {
                    $query->where('first_name', 'like', $term)
                        ->orWhere('last_name', 'like', $term)
                        ->orWhere('matricule', 'like', $term)
                        ->orWhere('guardian_name', 'like', $term);
                });
            })
            ->when($request->filled('class_id'), fn ($query) => $query->where('school_class_id', $request->integer('class_id')))
            ->when($request->filled('level'), fn ($query) => $query->whereHas('schoolClass', fn ($q) => $q->where('level', $request->string('level'))))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->has('active'), fn ($query) => $query->where('is_active', $request->boolean('active')))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate($request->integer('per_page', 20))
            ->withQueryString();

        $students->getCollection()->transform(function (Student $student) use ($canSeeFinance) {
            $student->append('average');

            if ($canSeeFinance) {
                $student->append('balance');
            }

            return $student;
        });

        return response()->json($students);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $student = Student::create($data);

        return response()->json(['student' => $student->load(['schoolClass:id,name,level,room', 'photos:id,student_id,filename'])], 201);
    }

    public function show(Request $request, Student $student): JsonResponse
    {
        $canSeeFinance = $request->user()?->hasAnyRole(User::ROLE_DIRECTION, User::ROLE_COMPTABLE) ?? false;
        $canSeeDocuments = $request->user()?->hasAnyRole(User::ROLE_DIRECTION, User::ROLE_SECRETARIAT) ?? false;

        $relations = [
            'photos:id,student_id,filename',
            'schoolClass:id,name,level,room,head_teacher_id',
            'schoolClass.headTeacher:id,first_name,last_name',
            'absences' => fn ($query) => $query->latest('date')->take(10),
            'grades.subject:id,name,code,coefficient',
            'grades.term:id,name',
        ];

        if ($canSeeFinance) {
            $relations['invoices'] = fn ($query) => $query->latest('issued_on')->withSum(['payments as paid_amount' => fn ($query) => $query->where('status', 'completed')], 'amount');
            $relations['payments'] = fn ($query) => $query->latest('paid_on');
        }

        if ($canSeeDocuments) {
            $relations[] = 'documents';
        }

        $student->load($relations)->loadCount([
            'absences',
            'absences as unjustified_absences_count' => fn ($query) => $query->where('is_justified', false),
        ]);

        $grades = $student->grades;
        $average = $grades->count() > 0
            ? round($grades->avg(fn ($grade) => ((float) $grade->score / max(1, (float) $grade->max_score)) * 20), 2)
            : null;

        $summary = [
            'average' => $average,
            'absences' => $student->absences_count,
            'unjustified_absences' => $student->unjustified_absences_count,
        ];

        if ($canSeeFinance) {
            $summary['outstanding'] = $student->invoices
                ->whereIn('status', ['pending', 'partial'])
                ->sum(fn ($invoice) => max(0, (float) $invoice->amount - (float) $invoice->paid_amount));
        }

        return response()->json([
            'student' => $student,
            'summary' => $summary,
        ]);
    }

    public function update(Request $request, Student $student): JsonResponse
    {
        $data = $request->validate($this->rules($student));
        $student->update($data);

        return response()->json(['student' => $student->fresh()->load(['schoolClass:id,name,level,room', 'photos:id,student_id,filename'])]);
    }

    public function destroy(Student $student): JsonResponse
    {
        $student->delete();

        return response()->json(status: 204);
    }

    private function rules(?Student $student = null): array
    {
        return [
            'school_class_id' => ['nullable', 'integer', 'exists:school_classes,id'],
            'matricule' => [$student ? 'sometimes' : 'required', 'string', 'max:40', Rule::unique('students', 'matricule')->ignore($student?->id)],
            'first_name' => [$student ? 'sometimes' : 'required', 'string', 'max:120'],
            'last_name' => [$student ? 'sometimes' : 'required', 'string', 'max:120'],
            'gender' => ['nullable', Rule::in(['M', 'F'])],
            'birth_date' => ['nullable', 'date'],
            'email' => ['nullable', 'email', 'max:180'],
            'phone' => ['nullable', 'string', 'max:40'],
            'address' => ['nullable', 'string', 'max:255'],
            'guardian_name' => ['nullable', 'string', 'max:180'],
            'guardian_phone' => ['nullable', 'string', 'max:40'],
            'guardian_email' => ['nullable', 'email', 'max:180'],
            'status' => ['nullable', Rule::in(['a_jour', 'en_retard', 'boursier'])],
            'enrolled_on' => ['nullable', 'date'],
            'is_active' => ['boolean'],
            'photo_path' => ['nullable', 'string', 'max:255'],
        ];
    }
}
