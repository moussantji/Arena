<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\AuditLog;
use App\Models\Department;
use App\Models\FeeType;
use App\Models\Term;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReferenceController extends Controller
{
    public function departments(): JsonResponse
    {
        return response()->json([
            'departments' => Department::withCount(['subjects', 'staff'])->orderBy('name')->get(),
        ]);
    }

    public function storeDepartment(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'code' => ['nullable', 'string', 'max:20', 'unique:departments,code'],
        ]);

        $department = Department::create($data);
        AuditLog::record('department.created', $department, "Département créé : {$department->name}");

        return response()->json(['department' => $department], 201);
    }

    public function updateDepartment(Request $request, Department $department): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'code' => ['nullable', 'string', 'max:20', Rule::unique('departments', 'code')->ignore($department->id)],
        ]);
        $department->update($data);
        AuditLog::record('department.updated', $department, "Département modifié : {$department->name}");

        return response()->json(['department' => $department->fresh()]);
    }

    public function destroyDepartment(Department $department): JsonResponse
    {
        $name = $department->name;
        $department->delete();
        AuditLog::record('department.deleted', $department, "Département supprimé : {$name}");

        return response()->json(status: 204);
    }

    public function feeTypes(): JsonResponse
    {
        return response()->json([
            'fee_types' => FeeType::withCount('invoices')->orderBy('name')->get(),
        ]);
    }

    public function storeFeeType(Request $request): JsonResponse
    {
        $data = $request->validate($this->feeTypeRules());

        $feeType = FeeType::create($data);
        AuditLog::record('fee_type.created', $feeType, "Type de frais créé : {$feeType->name}");

        return response()->json(['fee_type' => $feeType], 201);
    }

    public function updateFeeType(Request $request, FeeType $feeType): JsonResponse
    {
        $feeType->update($request->validate($this->feeTypeRules($feeType)));
        AuditLog::record('fee_type.updated', $feeType, "Type de frais modifié : {$feeType->name}");

        return response()->json(['fee_type' => $feeType->fresh()]);
    }

    public function destroyFeeType(FeeType $feeType): JsonResponse
    {
        $name = $feeType->name;
        $feeType->delete();
        AuditLog::record('fee_type.deleted', $feeType, "Type de frais supprimé : {$name}");

        return response()->json(status: 204);
    }

    public function academicYears(): JsonResponse
    {
        return response()->json([
            'academic_years' => AcademicYear::with('terms')->orderByDesc('starts_on')->get(),
            'current' => AcademicYear::current()->with('terms')->first(),
        ]);
    }

    public function storeAcademicYear(Request $request): JsonResponse
    {
        $data = $request->validate([
            'label' => ['required', 'string', 'max:40', 'unique:academic_years,label'],
            'starts_on' => ['required', 'date'],
            'ends_on' => ['required', 'date', 'after:starts_on'],
            'is_current' => ['boolean'],
        ]);

        if (! empty($data['is_current'])) {
            AcademicYear::query()->update(['is_current' => false]);
        }

        $academicYear = AcademicYear::create($data);
        AuditLog::record('year.created', $academicYear, "Année scolaire créée : {$academicYear->label}");

        return response()->json(['academic_year' => $academicYear], 201);
    }

    public function updateAcademicYear(Request $request, AcademicYear $academicYear): JsonResponse
    {
        $data = $request->validate([
            'label' => ['sometimes', 'string', 'max:40', Rule::unique('academic_years', 'label')->ignore($academicYear->id)],
            'starts_on' => ['sometimes', 'date'],
            'ends_on' => ['sometimes', 'date', 'after:starts_on'],
            'is_current' => ['sometimes', 'boolean'],
        ]);

        if (! empty($data['is_current'])) {
            AcademicYear::query()->whereKeyNot($academicYear->id)->update(['is_current' => false]);
        }

        $academicYear->update($data);
        AuditLog::record('year.updated', $academicYear, "Année scolaire modifiée : {$academicYear->label}");

        return response()->json(['academic_year' => $academicYear->fresh()]);
    }

    public function destroyAcademicYear(AcademicYear $academicYear): JsonResponse
    {
        $label = $academicYear->label;
        $academicYear->delete();
        AuditLog::record('year.deleted', $academicYear, "Année scolaire supprimée : {$label}");

        return response()->json(status: 204);
    }

    public function terms(Request $request): JsonResponse
    {
        return response()->json([
            'terms' => Term::with('academicYear:id,label')
                ->when($request->filled('academic_year_id'), fn ($query) => $query->where('academic_year_id', $request->integer('academic_year_id')))
                ->orderBy('starts_on')
                ->get(),
            'current' => Term::current()->with('academicYear:id,label')->first(),
        ]);
    }

    public function storeTerm(Request $request): JsonResponse
    {
        $data = $request->validate([
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'name' => ['required', 'string', 'max:80'],
            'starts_on' => ['required', 'date'],
            'ends_on' => ['required', 'date', 'after:starts_on'],
            'is_current' => ['boolean'],
        ]);

        if (! empty($data['is_current'])) {
            Term::query()->update(['is_current' => false]);
        }

        $term = Term::create($data);
        $term->load('academicYear:id,label');
        AuditLog::record('term.created', $term, "Période créée : {$term->name}");

        return response()->json(['term' => $term], 201);
    }

    public function updateTerm(Request $request, Term $term): JsonResponse
    {
        $data = $request->validate([
            'academic_year_id' => ['sometimes', 'integer', 'exists:academic_years,id'],
            'name' => ['sometimes', 'string', 'max:80'],
            'starts_on' => ['sometimes', 'date'],
            'ends_on' => ['sometimes', 'date', 'after:starts_on'],
            'is_current' => ['sometimes', 'boolean'],
        ]);

        if (! empty($data['is_current'])) {
            Term::query()->whereKeyNot($term->id)->update(['is_current' => false]);
        }

        $term->update($data);
        AuditLog::record('term.updated', $term, "Période modifiée : {$term->name}");

        return response()->json(['term' => $term->fresh()->load('academicYear:id,label')]);
    }

    public function destroyTerm(Term $term): JsonResponse
    {
        $name = $term->name;
        $term->delete();
        AuditLog::record('term.deleted', $term, "Période supprimée : {$name}");

        return response()->json(status: 204);
    }

    /**
     * Délibération : verrouille (ou rouvre) une période de notation.
     * Tant qu'elle est verrouillée, aucune note ne peut être créée,
     * modifiée ou supprimée. Chaque bascule est journalisée.
     */
    public function toggleLock(Request $request, Term $term): JsonResponse
    {
        $data = $request->validate(['locked' => ['required', 'boolean']]);
        $locked = $data['locked'];

        if ($term->isLocked() === $locked) {
            return response()->json(['term' => $term->fresh()->load('academicYear:id,label')]);
        }

        $term->update(['locked_at' => $locked ? now() : null]);
        AuditLog::record(
            $locked ? 'term.locked' : 'term.unlocked',
            $term,
            $locked
                ? "Période « {$term->name} » délibérée et verrouillée"
                : "Période « {$term->name} » rouverte",
        );

        return response()->json(['term' => $term->fresh()->load('academicYear:id,label')]);
    }

    private function feeTypeRules(?FeeType $feeType = null): array
    {
        return [
            'name' => [$feeType ? 'sometimes' : 'required', 'string', 'max:120'],
            'code' => [$feeType ? 'sometimes' : 'required', 'string', 'max:30', Rule::unique('fee_types', 'code')->ignore($feeType?->id)],
            'default_amount' => ['nullable', 'numeric', 'min:0'],
            'is_recurring' => ['boolean'],
            'is_active' => ['boolean'],
        ];
    }
}
