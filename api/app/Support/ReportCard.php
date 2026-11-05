<?php

namespace App\Support;

use App\Models\Grade;
use App\Models\Student;
use App\Models\Term;
use Illuminate\Http\Request;

/**
 * Construction du bulletin d'un élève (utilisé par l'API direction,
 * secrétariat et par l'API parent — restreinte aux enfants liés).
 */
final class ReportCard
{
    /**
     * @return array<string, mixed>
     */
    public static function build(Student $student, ?Term $term): array
    {
        $grades = $student->grades()
            ->with('subject:id,name,code,coefficient')
            ->when($term, fn ($query) => $query->where('term_id', $term->id))
            ->get();

        $subjects = $grades->groupBy('subject_id')->map(function ($subjectGrades) {
            $subject = $subjectGrades->first()->subject;
            $average = round($subjectGrades->avg(fn ($grade) => ((float) $grade->score / max(1, (float) $grade->max_score)) * 20), 2);

            return [
                'subject_id' => $subject?->id,
                'subject' => $subject?->name,
                'code' => $subject?->code,
                'coefficient' => (float) ($subject?->coefficient ?? 1),
                'average' => $average,
                'grades' => $subjectGrades->map(fn ($grade) => [
                    'evaluation' => $grade->evaluation,
                    'score' => (float) $grade->score,
                    'max_score' => (float) $grade->max_score,
                    'evaluated_on' => $grade->evaluated_on?->toDateString(),
                ])->values(),
            ];
        })->values();

        $totalCoefficients = $subjects->sum('coefficient');
        $generalAverage = $totalCoefficients > 0
            ? round($subjects->sum(fn ($subject) => $subject['average'] * $subject['coefficient']) / $totalCoefficients, 2)
            : null;

        $classAverages = Grade::query()
            ->selectRaw('student_id, AVG(score / max_score * 20) as average')
            ->where('school_class_id', $student->school_class_id)
            ->when($term, fn ($query) => $query->where('term_id', $term->id))
            ->groupBy('student_id')
            ->orderByDesc('average')
            ->pluck('average');

        $rank = $generalAverage !== null ? $classAverages->search(fn ($average) => round((float) $average, 2) <= $generalAverage) + 1 : null;

        return [
            'student' => $student->load('schoolClass:id,name,level,room'),
            'term' => $term,
            'subjects' => $subjects,
            'general_average' => $generalAverage,
            'total_coefficients' => $totalCoefficients,
            'rank' => $rank ?: null,
            'class_size' => $classAverages->count(),
            'mention' => match (true) {
                $generalAverage === null => null,
                $generalAverage >= 16 => 'Très bien',
                $generalAverage >= 14 => 'Bien',
                $generalAverage >= 12 => 'Assez bien',
                $generalAverage >= 10 => 'Passable',
                default => 'Insuffisant',
            },
        ];
    }

    /**
     * Résout la période demandée ou la période courante.
     */
    public static function resolveTerm(Request $request): ?Term
    {
        return $request->filled('term_id')
            ? Term::findOrFail($request->integer('term_id'))
            : Term::current()->first();
    }
}
