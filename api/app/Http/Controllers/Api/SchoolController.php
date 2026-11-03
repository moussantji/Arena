<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\School;
use App\Models\Term;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolController extends Controller
{
    public function show(): JsonResponse
    {
        $school = School::with('photos:id,school_id,filename')->first();
        $year = AcademicYear::current()->first();
        $term = Term::current()->first();

        return response()->json([
            'school' => $school,
            'academic_year' => $year,
            'term' => $term,
            'currency' => $school?->currency ?? 'FCFA',
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $school = School::query()->first() ?? new School;
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'full_name' => ['sometimes', 'string', 'max:180'],
            'academic_year' => ['nullable', 'string', 'max:40'],
            'term' => ['nullable', 'string', 'max:40'],
            'currency' => ['sometimes', 'string', 'max:8'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:180'],
            'logo_path' => ['nullable', 'string', 'max:255'],
        ]);
        $school->update($data);

        return response()->json(['school' => $school->fresh()->load('photos:id,school_id,filename')]);
    }
}
