<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $staff = Staff::query()
            ->with([
                'photos:id,staff_id,filename',
                'department:id,name,code',
            ])
            ->withCount(['classSubjects', 'headTeacherClasses'])
            ->when($request->filled('q'), function ($query) use ($request) {
                $term = '%'.$request->string('q')->toString().'%';
                $query->where(function ($query) use ($term) {
                    $query->where('first_name', 'like', $term)
                        ->orWhere('last_name', 'like', $term)
                        ->orWhere('email', 'like', $term);
                });
            })
            ->when($request->filled('department_id'), fn ($query) => $query->where('department_id', $request->integer('department_id')))
            ->when($request->filled('role'), fn ($query) => $query->where('role', 'like', '%'.$request->string('role')->toString().'%'))
            ->when($request->has('active'), fn ($query) => $query->where('is_active', $request->boolean('active')))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        return response()->json(['staff' => $staff]);
    }

    public function store(Request $request): JsonResponse
    {
        $staff = Staff::create($request->validate($this->rules()));

        return response()->json(['staff' => $staff->load(['department:id,name', 'photos:id,staff_id,filename'])], 201);
    }

    public function show(Staff $staff): JsonResponse
    {
        $staff->load([
            'photos:id,staff_id,filename',
            'department:id,name,code',
            'headTeacherClasses:id,name,level,room',
            'classSubjects.subject:id,name,code',
            'classSubjects.schoolClass:id,name,level,room',
            'timetableSlots' => fn ($query) => $query->orderBy('day_of_week')->orderBy('starts_at'),
            'timetableSlots.subject:id,name',
            'timetableSlots.schoolClass:id,name,room',
        ]);

        return response()->json(['staff' => $staff]);
    }

    public function update(Request $request, Staff $staff): JsonResponse
    {
        $staff->update($request->validate($this->rules($staff)));

        return response()->json(['staff' => $staff->fresh()->load(['department:id,name', 'photos:id,staff_id,filename'])]);
    }

    public function destroy(Staff $staff): JsonResponse
    {
        $staff->delete();

        return response()->json(status: 204);
    }

    private function rules(?Staff $staff = null): array
    {
        return [
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'first_name' => [$staff ? 'sometimes' : 'required', 'string', 'max:120'],
            'last_name' => [$staff ? 'sometimes' : 'required', 'string', 'max:120'],
            'role' => [$staff ? 'sometimes' : 'required', 'string', 'max:120'],
            'years_experience' => ['nullable', 'integer', 'min:0', 'max:60'],
            'phone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:180', Rule::unique('staff', 'email')->ignore($staff?->id)],
            'hired_on' => ['nullable', 'date'],
            'is_active' => ['boolean'],
        ];
    }
}
