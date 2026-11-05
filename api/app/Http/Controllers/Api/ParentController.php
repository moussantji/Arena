<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absence;
use App\Models\AcademicYear;
use App\Models\Invoice;
use App\Models\School;
use App\Models\Student;
use App\Models\Term;
use App\Support\ReportCard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * API « parent » : un parent ne peut consulter que les enfants qui lui
 * sont liés (table parent_student, gérée par la direction). Aucun
 * enseignant, aucun comptable : même token Sanctum, périmètre restreint.
 */
class ParentController extends Controller
{
    /** Informations minimales pour l'en-tête de l'app (établissement, année, période). */
    public function meta(): JsonResponse
    {
        return response()->json([
            'school' => School::with('photos:id,school_id,filename')->first(),
            'academic_year' => AcademicYear::current()->first(),
            'term' => Term::current()->first(),
            'terms' => Term::orderBy('starts_on')->get(['id', 'name', 'starts_on', 'ends_on', 'is_current', 'locked_at']),
        ]);
    }

    /** Enfants liés au compte, avec classe et photo. */
    public function children(Request $request): JsonResponse
    {
        $children = $request->user()->children()
            ->with(['schoolClass:id,name,level,room', 'photos:id,student_id,filename'])
            ->orderBy('students.last_name')
            ->orderBy('students.first_name')
            ->get();

        return response()->json(['children' => $children]);
    }

    /** Fiche d'un enfant lié (contexte pour les écrans notes/absences/finances). */
    public function child(Request $request, Student $student): JsonResponse
    {
        $child = $this->linkedChild($request, $student);

        return response()->json([
            'child' => $child->load(['schoolClass:id,name,level,room', 'photos:id,student_id,filename']),
        ]);
    }

    /** Bulletin d'un enfant lié pour la période demandée (ou la période courante). */
    public function reportCard(Request $request, Student $student): JsonResponse
    {
        $child = $this->linkedChild($request, $student);

        return response()->json(ReportCard::build($child, ReportCard::resolveTerm($request)));
    }

    /** Absences d'un enfant lié ; filtrage optionnel par trimestre. */
    public function absences(Request $request, Student $student): JsonResponse
    {
        $child = $this->linkedChild($request, $student);
        $term = $request->filled('term_id')
            ? Term::findOrFail($request->integer('term_id'))
            : null;

        $absences = Absence::query()
            ->where('student_id', $child->id)
            ->when($term, fn ($query) => $query->where('term_id', $term->id))
            ->with(['schoolClass:id,name', 'term:id,name'])
            ->latest('date')
            ->get()
            ->map(fn (Absence $absence) => [
                'id' => $absence->id,
                'date' => $absence->date?->toDateString(),
                'starts_at' => $absence->starts_at,
                'ends_at' => $absence->ends_at,
                'reason' => $absence->reason,
                'is_justified' => (bool) $absence->is_justified,
                'justification' => $absence->justification,
                'class' => $absence->schoolClass?->name,
                'term_id' => $absence->term_id,
            ]);

        return response()->json([
            'term' => $term,
            'absences' => $absences,
            'summary' => [
                'total' => $absences->count(),
                'justified' => $absences->where('is_justified', true)->count(),
                'unjustified' => $absences->where('is_justified', false)->count(),
            ],
        ]);
    }

    /** Factures et paiements d'un enfant lié, avec le solde. */
    public function finances(Request $request, Student $student): JsonResponse
    {
        $child = $this->linkedChild($request, $student);

        $invoices = Invoice::query()
            ->where('student_id', $child->id)
            ->with(['feeType:id,name,code', 'term:id,name', 'payments' => fn ($query) => $query->latest('paid_on')])
            ->latest('issued_on')
            ->get()
            ->map(fn (Invoice $invoice) => $this->invoicePayload($invoice));

        $totalDue = (float) $invoices->sum('amount');
        $totalPaid = (float) $invoices->sum('paid_total');
        $outstanding = max(0, round($totalDue - $totalPaid, 2));

        return response()->json([
            'invoices' => $invoices,
            'summary' => [
                'total_due' => $totalDue,
                'total_paid' => $totalPaid,
                'outstanding' => $outstanding,
                'pending_count' => $invoices->whereIn('status', ['pending', 'partial'])->count(),
            ],
        ]);
    }

    /** @return array<string, mixed> */
    private function invoicePayload(Invoice $invoice): array
    {
        $paid = (float) $invoice->payments
            ->where('status', 'completed')
            ->sum('amount');

        return [
            'id' => $invoice->id,
            'reference' => $invoice->reference,
            'fee_type' => $invoice->feeType?->name,
            'term' => $invoice->term?->name,
            'issued_on' => $invoice->issued_on?->toDateString(),
            'due_on' => $invoice->due_on?->toDateString(),
            'amount' => (float) $invoice->amount,
            'status' => $invoice->status,
            'paid_total' => round($paid, 2),
            'remaining' => round(max(0, (float) $invoice->amount - $paid), 2),
            'payments' => $invoice->payments->map(fn ($payment) => [
                'id' => $payment->id,
                'amount' => (float) $payment->amount,
                'method' => $payment->method,
                'paid_on' => $payment->paid_on?->toDateString(),
                'reference' => $payment->reference,
                'status' => $payment->status,
            ])->values(),
        ];
    }

    /**
     * Résout l'enfant et vérifie la liaison parent ↔ élève.
     */
    private function linkedChild(Request $request, Student $student): Student
    {
        $linked = $request->user()->children()->where('students.id', $student->id)->exists();
        if (! $linked) {
            // 404 : ne pas révéler l'existence d'élèves non liés.
            throw new NotFoundHttpException('Élève introuvable.');
        }

        return $student;
    }
}
