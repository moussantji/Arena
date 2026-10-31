<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\SchoolClass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SchoolClassController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $classes = SchoolClass::query()
            ->with(['headTeacher:id,first_name,last_name,role', 'headTeacher.photos:id,staff_id,filename'])
            ->withCount(['students' => fn ($query) => $query->where('is_active', true), 'classSubjects'])
            ->when($request->filled('academic_year_id'), fn ($query) => $query->where('academic_year_id', $request->integer('academic_year_id')))
            ->when(! $request->filled('academic_year_id'), fn ($query) => $query->where('academic_year_id', AcademicYear::current()->value('id')))
            ->when($request->filled('level'), fn ($query) => $query->where('level', $request->string('level')))
            ->orderBy('level')
            ->orderBy('name')
            ->get();

        return response()->json(['classes' => $classes]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $data['academic_year_id'] ??= AcademicYear::current()->value('id');
        $class = SchoolClass::create($data);

        return response()->json(['class' => $class->load(['headTeacher:id,first_name,last_name', 'headTeacher.photos:id,staff_id,filename'])], 201);
    }

    public function show(SchoolClass $class): JsonResponse
    {
        $class->load([
            'headTeacher:id,first_name,last_name,role,email,phone',
            'headTeacher.photos:id,staff_id,filename',
            'students' => fn ($query) => $query->orderBy('last_name')->orderBy('first_name'),
            'students.photos:id,student_id,filename',
            'classSubjects.subject:id,name,code,coefficient,weekly_hours',
            'classSubjects.staff:id,first_name,last_name,role',
            'classSubjects.staff.photos:id,staff_id,filename',
            'timetableSlots' => fn ($query) => $query->orderBy('day_of_week')->orderBy('starts_at'),
            'timetableSlots.subject:id,name,code',
            'timetableSlots.staff:id,first_name,last_name',
            'timetableSlots.staff.photos:id,staff_id,filename',
        ]);

        return response()->json(['class' => $class]);
    }

    public function update(Request $request, SchoolClass $class): JsonResponse
    {
        $data = $request->validate($this->rules($class));
        $class->update($data);

        return response()->json(['class' => $class->fresh()->load(['headTeacher:id,first_name,last_name', 'headTeacher.photos:id,staff_id,filename'])]);
    }

    public function destroy(SchoolClass $class): JsonResponse
    {
        $class->delete();

        return response()->json(status: 204);
    }

    private function rules(?SchoolClass $class = null): array
    {
        return [
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'head_teacher_id' => ['nullable', 'integer', 'exists:staff,id'],
            'name' => [$class ? 'sometimes' : 'required', 'string', 'max:120', Rule::unique('school_classes', 'name')->where('academic_year_id', request()->input('academic_year_id', $class?->academic_year_id ?? AcademicYear::current()->value('id')))->ignore($class?->id)],
            'level' => [$class ? 'sometimes' : 'required', 'string', 'max:60'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:500'],
            'room' => ['nullable', 'string', 'max:40'],
            'is_active' => ['boolean'],
        ];
    }
}
