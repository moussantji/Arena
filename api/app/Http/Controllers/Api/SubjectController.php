<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SubjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $subjects = Subject::query()
            ->with('department:id,name,code')
            ->withCount('classes')
            ->when($request->filled('department_id'), fn ($query) => $query->where('department_id', $request->integer('department_id')))
            ->when($request->has('active'), fn ($query) => $query->where('is_active', $request->boolean('active')))
            ->orderBy('name')
            ->get();

        $subjects->each->append(['average', 'teachers_count']);

        return response()->json(['subjects' => $subjects]);
    }

    public function store(Request $request): JsonResponse
    {
        $subject = Subject::create($request->validate($this->rules()));

        return response()->json(['subject' => $subject->load('department:id,name')], 201);
    }

    public function show(Subject $subject): JsonResponse
    {
        $subject->load([
            'department:id,name,code',
            'classes:id,name,level,room',
            'classSubjects.staff:id,first_name,last_name',
        ]);

        return response()->json(['subject' => $subject]);
    }

    public function update(Request $request, Subject $subject): JsonResponse
    {
        $subject->update($request->validate($this->rules($subject)));

        return response()->json(['subject' => $subject->fresh()->load('department:id,name')]);
    }

    public function destroy(Subject $subject): JsonResponse
    {
        $subject->delete();

        return response()->json(status: 204);
    }

    private function rules(?Subject $subject = null): array
    {
        return [
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'name' => [$subject ? 'sometimes' : 'required', 'string', 'max:120'],
            'code' => [$subject ? 'sometimes' : 'required', 'string', 'max:20', Rule::unique('subjects', 'code')->ignore($subject?->id)],
            'weekly_hours' => ['nullable', 'integer', 'min:0', 'max:60'],
            'coefficient' => ['nullable', 'numeric', 'min:0.5', 'max:10'],
            'is_active' => ['boolean'],
        ];
    }
}
