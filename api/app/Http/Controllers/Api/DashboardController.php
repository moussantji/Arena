<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absence;
use App\Models\AcademicYear;
use App\Models\AppNotification;
use App\Models\Payment;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\TimetableSlot;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $year = AcademicYear::current()->first();
        $canSeeFinance = $request->user()?->hasAnyRole(User::ROLE_DIRECTION, User::ROLE_COMPTABLE) ?? false;
        $students = Student::where('is_active', true)->count();
        $classes = SchoolClass::when($year, fn ($q) => $q->where('academic_year_id', $year->id))->count();

        $monthStart = now()->startOfMonth();
        $monthEnd = now()->endOfMonth();
        $absences = Absence::whereBetween('date', [$monthStart->toDateString(), $monthEnd->toDateString()])->count();
        $expected = max(1, $students * 20);
        $attendance = round(max(0, 100 - ($absences / $expected * 100)), 1);

        $recovery = (float) Payment::where('status', 'completed')
            ->whereYear('paid_on', now()->year)
            ->sum('amount');

        $series = Payment::query()
            ->where('status', 'completed')
            ->where('paid_on', '>=', now()->subMonths(11)->startOfMonth()->toDateString())
            ->get(['paid_on', 'amount'])
            ->groupBy(fn (Payment $payment) => $payment->paid_on->format('Y-m'))
            ->sortKeys()
            ->map(fn ($payments, $month) => [
                'month' => $month,
                'label' => Carbon::createFromFormat('Y-m', $month)->translatedFormat('M'),
                'total' => (float) $payments->sum('amount'),
            ])
            ->values();

        $distribution = SchoolClass::query()
            ->select('level', DB::raw('SUM((SELECT COUNT(*) FROM students WHERE students.school_class_id = school_classes.id)) as effectif'))
            ->when($year, fn ($q) => $q->where('academic_year_id', $year->id))
            ->groupBy('level')
            ->orderByDesc('effectif')
            ->get()
            ->map(fn ($row) => ['label' => $row->level, 'value' => (int) $row->effectif]);

        $todaySlots = TimetableSlot::with(['subject:id,name', 'staff:id,first_name,last_name', 'staff.photos:id,staff_id,filename', 'schoolClass:id,name,room'])
            ->where('day_of_week', now()->dayOfWeekIso)
            ->orderBy('starts_at')
            ->take(8)
            ->get();

        $recentStudents = Student::with(['schoolClass:id,name', 'photos:id,student_id,filename'])
            ->latest()
            ->take(6)
            ->get(['id', 'first_name', 'last_name', 'matricule', 'school_class_id', 'status', 'created_at']);

        $notifications = AppNotification::latest()->take(5)->get();

        return response()->json([
            'school' => School::first(),
            'kpis' => [
                'students' => $students,
                'attendance' => $attendance,
                'recovery' => $canSeeFinance ? $recovery : null,
                'classes' => $classes,
            ],
            'recovery_series' => $canSeeFinance ? $series : [],
            'class_distribution' => $distribution,
            'today' => $todaySlots,
            'recent_students' => $recentStudents,
            'notifications' => $notifications,
        ]);
    }
}
