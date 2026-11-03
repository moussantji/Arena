<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absence;
use App\Models\AcademicYear;
use App\Models\Admission;
use App\Models\AppNotification;
use App\Models\Department;
use App\Models\FeeType;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Term;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MetaController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $year = AcademicYear::current()->first();
        $term = Term::current()->first();
        $user = $request->user();
        $canSeeFinance = $user?->hasAnyRole(User::ROLE_DIRECTION, User::ROLE_COMPTABLE) ?? false;
        $canSeeAdmissions = $user?->hasAnyRole(User::ROLE_DIRECTION, User::ROLE_SECRETARIAT) ?? false;

        $counts = [
            'students' => Student::where('is_active', true)->count(),
            'classes' => SchoolClass::count(),
            'subjects' => Subject::count(),
            'staff' => Staff::where('is_active', true)->count(),
            'admissions' => $canSeeAdmissions
                ? Admission::whereNotIn('status', ['inscrit', 'refuse'])->count()
                : 0,
            'unread_notifications' => AppNotification::whereNull('read_at')->count(),
            'absences_this_month' => Absence::whereMonth('date', now()->month)->whereYear('date', now()->year)->count(),
        ];

        if ($canSeeFinance) {
            $counts['pending_invoices'] = Invoice::whereIn('status', ['pending', 'partial'])->count();
            $counts['payments_this_month'] = (float) Payment::where('status', 'completed')
                ->whereMonth('paid_on', now()->month)
                ->whereYear('paid_on', now()->year)
                ->sum('amount');
        }

        return response()->json([
            'school' => School::with('photos:id,school_id,filename')->first(),
            'academic_year' => $year,
            'term' => $term,
            'classes' => SchoolClass::query()
                ->when($year, fn ($query) => $query->where('academic_year_id', $year->id))
                ->orderBy('level')
                ->orderBy('name')
                ->get(['id', 'name', 'level', 'room', 'capacity']),
            'departments' => Department::orderBy('name')->get(['id', 'name', 'code']),
            'students' => Student::query()
                ->with('photos:id,student_id,filename')
                ->where('is_active', true)
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->get(['id', 'matricule', 'first_name', 'last_name', 'school_class_id']),
            'subjects' => Subject::orderBy('name')->get(['id', 'name', 'code', 'department_id', 'coefficient', 'weekly_hours']),
            'staff' => Staff::query()
                ->with('photos:id,staff_id,filename')
                ->where('is_active', true)
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->get(['id', 'first_name', 'last_name', 'role', 'department_id']),
            'terms' => Term::orderBy('starts_on')->get(['id', 'academic_year_id', 'name', 'starts_on', 'ends_on', 'is_current']),
            'fee_types' => $canSeeFinance
                ? FeeType::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code', 'default_amount'])
                : [],
            'counts' => $counts,
            'options' => [
                'student_status' => ['a_jour', 'en_retard', 'boursier'],
                'admission_status' => ['nouveau', 'entretien', 'valide', 'inscrit', 'refuse'],
                'invoice_status' => ['paid', 'pending', 'partial', 'cancelled'],
                'payment_methods' => ['cash', 'mobile_money', 'bank', 'card', 'other'],
                'evaluations' => ['devoir_1', 'devoir_2', 'composition'],
                'days' => ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
            ],
        ]);
    }
}
