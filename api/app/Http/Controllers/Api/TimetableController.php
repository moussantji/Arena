<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TimetableSlot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimetableController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $slots = TimetableSlot::query()
            ->with([
                'subject:id,name,code',
                'staff:id,first_name,last_name',
                'staff.photos:id,staff_id,filename',
                'schoolClass:id,name,level,room',
                'term:id,name',
            ])
            ->when($request->filled('class_id'), fn ($query) => $query->where('school_class_id', $request->integer('class_id')))
            ->when($request->filled('staff_id'), fn ($query) => $query->where('staff_id', $request->integer('staff_id')))
            ->when($request->filled('day'), fn ($query) => $query->where('day_of_week', $request->integer('day')))
            ->when($request->filled('term_id'), fn ($query) => $query->where('term_id', $request->integer('term_id')))
            ->when($request->boolean('live'), fn ($query) => $query->where('is_live', true))
            ->orderBy('day_of_week')
            ->orderBy('starts_at')
            ->get();

        $grouped = $slots->groupBy('day_of_week')->map(fn ($daySlots, $day) => [
            'day' => (int) $day,
            'label' => ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][(int) $day] ?? '',
            'slots' => $daySlots->values(),
        ])->values();

        return response()->json(['slots' => $slots, 'days' => $grouped]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $slot = TimetableSlot::create($data);

        return response()->json(['slot' => $slot->load('subject:id,name', 'staff:id,first_name,last_name', 'staff.photos:id,staff_id,filename', 'schoolClass:id,name')], 201);
    }

    public function show(TimetableSlot $timetable): JsonResponse
    {
        return response()->json(['slot' => $timetable->load('subject', 'staff.photos:id,staff_id,filename', 'staff', 'schoolClass', 'term')]);
    }

    public function update(Request $request, TimetableSlot $timetable): JsonResponse
    {
        $timetable->update($request->validate($this->rules($timetable)));

        return response()->json(['slot' => $timetable->fresh()->load('subject:id,name', 'staff:id,first_name,last_name', 'staff.photos:id,staff_id,filename', 'schoolClass:id,name')]);
    }

    public function destroy(TimetableSlot $timetable): JsonResponse
    {
        $timetable->delete();

        return response()->json(status: 204);
    }

    private function rules(?TimetableSlot $slot = null): array
    {
        $startsAt = request()->input('starts_at', $slot?->starts_at ? substr($slot->starts_at, 0, 5) : null);

        return [
            'school_class_id' => [$slot ? 'sometimes' : 'required', 'integer', 'exists:school_classes,id'],
            'subject_id' => [$slot ? 'sometimes' : 'required', 'integer', 'exists:subjects,id'],
            'staff_id' => ['nullable', 'integer', 'exists:staff,id'],
            'term_id' => ['nullable', 'integer', 'exists:terms,id'],
            'day_of_week' => [$slot ? 'sometimes' : 'required', 'integer', 'between:1,7'],
            'starts_at' => [$slot ? 'sometimes' : 'required', 'date_format:H:i'],
            'ends_at' => [$slot ? 'sometimes' : 'required', 'date_format:H:i', $startsAt ? 'after:'.$startsAt : ''],
            'room' => ['nullable', 'string', 'max:40'],
            'is_live' => ['boolean'],
        ];
    }
}
